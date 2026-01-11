import { View, ViewInput } from '../libs/types/view'; // ViewInput interfeysini to'g'ri import qilish
import Errors from '../libs/Errors';
import { HttpCode } from '../libs/Errors';
import { Message } from '../libs/Errors';
import ViewModel from '../schema/View.model';

class ViewService {
	private readonly viewModel;

	constructor() {
		this.viewModel = ViewModel;
	}

	public async checkViewExistence(input: ViewInput): Promise<View> {
		return await this.viewModel.findOne({ memberId: input.memberId, viewRefId: input.viewRefId }).exec();
	}

	public async insertMemberView(input: ViewInput): Promise<View> {
		try {
			return await this.viewModel.create(input); // Yangi member view logini yaratish
		} catch (err) {
			console.log('ERROR, model: insertMemberView:', err); // Xatolikni konsolga chiqarish
			throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED); // Xatolikni yuborish
		}
	}
}

export default ViewService;
