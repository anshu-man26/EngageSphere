import { formatDateSeparator } from "../../utils/dateUtils";

const DateSeparator = ({ date }) => {
	const formattedDate = formatDateSeparator(date);
	
	return (
		<div className="flex justify-center my-4">
			<div className="bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-full px-4 py-2">
				<span className="text-xs text-gray-300 font-medium">
					{formattedDate}
				</span>
			</div>
		</div>
	);
};

export default DateSeparator; 