import MemberModel from '../schema/Member.model';
import { LoginInput, Member, MemberInput, MemberUpdateInput } from '../libs/types/member';
import Errors, { HttpCode, Message } from '../libs/Errors';
import { MemberStatus, MemberType } from '../libs/enums/member.enum';
import * as bcrypt from 'bcryptjs';
import { shapeIntoMongooseObjectId } from '../libs/config';

class MemberService {
	private readonly memberModel;

	constructor() {
		this.memberModel = MemberModel;
	}

	/** SPA */
	public async getSeller(): Promise<Member> {
		const result = await this.memberModel.findOne({ memberType: MemberType.SELLER }).lean().exec();

		if (!result) {
			throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		}

		return result;
	}

	public async signup(input: MemberInput): Promise<Member> {
		const salt = await bcrypt.genSalt(); // `berypt` noto'g'ri edi, `bcrypt` deb tuzatilgan
		input.memberPassword = await bcrypt.hash(input.memberPassword, salt); // Parolni xesh qilish

		try {
			const result = await this.memberModel.create(input); // Ma'lumotlar bazasiga yozish
			result.memberPassword = ''; // Parolni javobdan olib tashlash (xavfsizlik uchun)
			return result.toJSON(); // JSON formatida natijani qaytarish
		} catch (err) {
			console.error('Error, model:signup', err); // Xatoni log qilish
			throw new Errors(HttpCode.BAD_REQUEST, Message.USED_NICK_PHONE); // Xatolikni fırlatish
		}
	}

	public async login(input: LoginInput): Promise<Member> {
		const member = await this.memberModel
			.findOne({ memberNick: input.memberNick }, { memberNick: 1, memberPassword: 1 })
			.exec();
		if (!member) {
			throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_NICK);
		}

		const isMatch = await bcrypt.compare(input.memberPassword, member.memberPassword);
		if (!isMatch) {
			throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);
		}

		return await this.memberModel.findById(member._id).lean().exec();
	}

	public async getMemberDetail(member: Member): Promise<Member> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		const result = await this.memberModel.findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE }).exec();

		if (!result) {
			throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		}

		return result;
	}

	public async updateMember(member: Member, input: MemberUpdateInput): Promise<Member> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		const result = await this.memberModel.findOneAndUpdate({ _id: memberId }, input, { new: true }).exec();

		if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
		return result;
	}

	public async getTopUsers(): Promise<Member[]> {
		const result = await this.memberModel
			.find({
				memberStatus: MemberStatus.ACTIVE,
				memberPoints: { $gte: 1 },
			})
			.sort({ memberPoints: -1 })
			.limit(4)
			.exec();

		if (result.length === 0) {
			throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		}

		return result;
	}
	public async getUsers(): Promise<Member[]> {
		const result = await this.memberModel.find({ memberType: MemberType.USER }).exec();

		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		return result;
	}

	public async updateChosenUser(input: MemberUpdateInput): Promise<Member[]> {
		input._id = shapeIntoMongooseObjectId(input._id);
		const result = await this.memberModel.findByIdAndUpdate({ _id: input._id }, input, { new: true }).exec();

		if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
		return result;
	}

	/** SPA */
	/**SSR */
	public async processSignup(input: MemberInput): Promise<Member> {
		const exist = await this.memberModel.findOne({ memberType: MemberType.SELLER }).exec();

		if (exist) throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);

		const salt = await bcrypt.genSalt();
		input.memberPassword = await bcrypt.hash(input.memberPassword, salt);

		try {
			const tempResult = new this.memberModel(input);
			const result = await tempResult.save();
			result.memberPassword = '';
			return result;
		} catch (err) {
			throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
		}
	}

	public async processLogin(input: LoginInput): Promise<Member> {
		const member = await this.memberModel
			.findOne({ memberNick: input.memberNick }, { memberNick: 1, memberPassword: 1 })
			.exec();
		if (!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_NICK);

		const isMatch = await bcrypt.compare(input.memberPassword, member.memberPassword);

		// const isMatch = input.memberPassword === member.memberPassword;
		// console.log("isMatch :", isMatch);

		if (!isMatch) {
			throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);
		}

		return await this.memberModel.findById(member._id).exec();

		//  console.log("result", result);
		//  return result;
	}

	public async addUserPoint(member: Member, point: number): Promise<Member> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		return await this.memberModel
			.findOneAndUpdate(
				{ _id: memberId, memberType: MemberType.USER, memberStatus: MemberStatus.ACTIVE },
				{ $inc: { memberPoints: point } },
				{ new: true },
			)
			.exec();
	}
}
/**SSR */

export default MemberService;
