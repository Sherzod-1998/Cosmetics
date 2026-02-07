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
		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		return result as any;
	}

	public async signup(input: MemberInput): Promise<Member> {
		const salt = await bcrypt.genSalt();
		input.memberPassword = await bcrypt.hash(input.memberPassword, salt);

		try {
			const result = await this.memberModel.create(input);
			(result as any).memberPassword = '';
			return (result.toJSON ? result.toJSON() : result) as any;
		} catch (err) {
			console.error('Error, model:signup', err);
			throw new Errors(HttpCode.BAD_REQUEST, Message.USED_NICK_PHONE);
		}
	}

	public async login(input: LoginInput): Promise<Member> {
		const member = await this.memberModel
			.findOne({ memberNick: input.memberNick }, { memberNick: 1, memberPassword: 1 })
			.exec();

		if (!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_NICK);

		const isMatch = await bcrypt.compare(input.memberPassword, (member as any).memberPassword);
		if (!isMatch) throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);

		const full = await this.memberModel.findById(member._id).lean().exec();
		if (!full) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		return full as any;
	}

	public async getMemberDetail(member: Member): Promise<Member> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		const result = await this.memberModel.findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE }).exec();
		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		return result as any;
	}

	public async updateMember(member: Member, input: MemberUpdateInput): Promise<Member> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		const result = await this.memberModel.findOneAndUpdate({ _id: memberId }, input, { new: true }).exec();
		if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
		return result as any;
	}

	public async getTopUsers(): Promise<Member[]> {
		const result = await this.memberModel
			.find({ memberStatus: MemberStatus.ACTIVE, memberPoints: { $gte: 1 } })
			.sort({ memberPoints: -1 })
			.limit(4)
			.exec();

		if (!result || result.length === 0) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		return result as any;
	}

	public async getUsers(inquiry?: { q?: string; status?: string; sort?: string }): Promise<Member[]> {
		const q = inquiry?.q?.trim() || '';
		const status = inquiry?.status || 'ALL';
		const sort = inquiry?.sort || 'newest';

		const filter: any = { memberType: MemberType.USER };

		if (q) {
			filter.$or = [{ memberNick: { $regex: q, $options: 'i' } }, { memberPhone: { $regex: q, $options: 'i' } }];
		}

		if (status !== 'ALL') filter.memberStatus = status;

		let sortQuery: any = { _id: -1 };
		if (sort === 'oldest') sortQuery = { _id: 1 };
		if (sort === 'name_asc') sortQuery = { memberNick: 1 };
		if (sort === 'name_desc') sortQuery = { memberNick: -1 };

		const result = await this.memberModel.find(filter).sort(sortQuery).exec();
		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		return result as any;
	}

	public async updateChosenUser(input: MemberUpdateInput): Promise<Member> {
		(input as any)._id = shapeIntoMongooseObjectId((input as any)._id);
		const result = await this.memberModel.findByIdAndUpdate({ _id: (input as any)._id }, input, { new: true }).exec();
		if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
		return result as any;
	}

	/** SSR */
	public async processSignup(input: MemberInput): Promise<Member> {
		const exist = await this.memberModel.findOne({ memberType: MemberType.SELLER }).exec();
		if (exist) throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);

		const salt = await bcrypt.genSalt();
		input.memberPassword = await bcrypt.hash(input.memberPassword, salt);

		try {
			const tempResult = new this.memberModel(input);
			const result = await tempResult.save();
			(result as any).memberPassword = '';
			return result as any;
		} catch (err) {
			throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
		}
	}

	public async processLogin(input: LoginInput): Promise<Member> {
		const member = await this.memberModel
			.findOne({ memberNick: input.memberNick }, { memberNick: 1, memberPassword: 1 })
			.exec();

		if (!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_NICK);

		const isMatch = await bcrypt.compare(input.memberPassword, (member as any).memberPassword);
		if (!isMatch) throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);

		const full = await this.memberModel.findById(member._id).exec();
		if (!full) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		return full as any;
	}

	public async addUserPoint(member: Member, point: number): Promise<Member> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		const updated = await this.memberModel
			.findOneAndUpdate(
				{ _id: memberId, memberType: MemberType.USER, memberStatus: MemberStatus.ACTIVE },
				{ $inc: { memberPoints: point } },
				{ new: true },
			)
			.exec();

		if (!updated) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		return updated as any;
	}
}

export default MemberService;
