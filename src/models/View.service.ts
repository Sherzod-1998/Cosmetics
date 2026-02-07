import { View, ViewInput } from '../libs/types/view';
import Errors from '../libs/Errors';
import { HttpCode, Message } from '../libs/Errors'; // Message importini to'g'irladim
import ViewModel from '../schema/View.model';

class ViewService {
	private readonly viewModel;

	constructor() {
		this.viewModel = ViewModel;
	}

	public async checkViewExistence(input: ViewInput): Promise<View | null> {
		// Mongoose qaytargan natijani 'View' turiga o'tkazamiz
		return (await this.viewModel
			.findOne({ memberId: input.memberId, viewRefId: input.viewRefId })
			.exec()) as View | null;
	}

	public async insertMemberView(input: ViewInput): Promise<View> {
		try {
			// 'as any' yoki 'as unknown as View' orqali TS xatoligini chetlab o'tamiz
			const result = await this.viewModel.create(input);
			return result as unknown as View;
		} catch (err) {
			console.log('ERROR, model: insertMemberView:', err);
			throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
		}
	}
}

export default ViewService;
