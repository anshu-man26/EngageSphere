import { FaMars, FaVenus } from "react-icons/fa";

const GenderCheckbox = ({ onCheckboxChange, selectedGender }) => {
	return (
		<div className='flex gap-4'>
			<div className='flex-1'>
				<label 
					className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
						selectedGender === "male" 
							? 'border-blue-500 bg-blue-500/20 text-blue-400' 
							: 'border-gray-600 bg-white/5 text-gray-300 hover:border-gray-500'
					}`}
				>
					<FaMars className={`text-lg ${selectedGender === "male" ? 'text-blue-400' : 'text-gray-400'}`} />
					<span className='font-medium'>Male</span>
					<input
						type='radio'
						name='gender'
						className='sr-only'
						checked={selectedGender === "male"}
						onChange={() => onCheckboxChange("male")}
					/>
				</label>
			</div>
			
			<div className='flex-1'>
				<label 
					className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
						selectedGender === "female" 
							? 'border-pink-500 bg-pink-500/20 text-pink-400' 
							: 'border-gray-600 bg-white/5 text-gray-300 hover:border-gray-500'
					}`}
				>
					<FaVenus className={`text-lg ${selectedGender === "female" ? 'text-pink-400' : 'text-gray-400'}`} />
					<span className='font-medium'>Female</span>
					<input
						type='radio'
						name='gender'
						className='sr-only'
						checked={selectedGender === "female"}
						onChange={() => onCheckboxChange("female")}
					/>
				</label>
			</div>
		</div>
	);
};

export default GenderCheckbox;

// STARTER CODE FOR THIS FILE
// const GenderCheckbox = () => {
// 	return (
// 		<div className='flex'>
// 			<div className='form-control'>
// 				<label className={`label gap-2 cursor-pointer`}>
// 					<span className='label-text'>Male</span>
// 					<input type='checkbox' className='checkbox border-slate-900' />
// 				</label>
// 			</div>
// 			<div className='form-control'>
// 				<label className={`label gap-2 cursor-pointer`}>
// 					<span className='label-text'>Female</span>
// 					<input type='checkbox' className='checkbox border-slate-900' />
// 				</label>
// 			</div>
// 		</div>
// 	);
// };
// export default GenderCheckbox;
