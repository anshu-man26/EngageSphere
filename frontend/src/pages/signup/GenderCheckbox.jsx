import { FaMars, FaVenus } from "react-icons/fa";

const Tile = ({ active, label, Icon, onClick }) => (
	<label
		onClick={onClick}
		className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl ring-1 cursor-pointer transition-colors ${
			active
				? "ring-emerald-500/60 bg-emerald-500/10 text-emerald-300"
				: "ring-[#374248] bg-[#202C33]/40 text-[#D1D7DB] hover:bg-[#202C33]/70"
		}`}
	>
		<Icon className={`text-base ${active ? "text-emerald-400" : "text-[#8696A0]"}`} />
		<span className='text-sm font-medium'>{label}</span>
	</label>
);

const GenderCheckbox = ({ onCheckboxChange, selectedGender }) => (
	<div className='grid grid-cols-2 gap-2'>
		<Tile
			active={selectedGender === "male"}
			label='Male'
			Icon={FaMars}
			onClick={() => onCheckboxChange("male")}
		/>
		<Tile
			active={selectedGender === "female"}
			label='Female'
			Icon={FaVenus}
			onClick={() => onCheckboxChange("female")}
		/>
	</div>
);

export default GenderCheckbox;
