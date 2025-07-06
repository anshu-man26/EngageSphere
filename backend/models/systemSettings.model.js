import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema({
	// Mobile availability settings
	mobileAvailability: {
		enabled: {
			type: Boolean,
			default: true
		},
		message: {
			type: String,
			default: "Website is currently unavailable for mobile users. Please use a desktop device."
		},
		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Admin"
		},
		updatedAt: {
			type: Date,
			default: Date.now
		}
	},
	
	// General system settings
	maintenanceMode: {
		enabled: {
			type: Boolean,
			default: false
		},
		message: {
			type: String,
			default: "System is under maintenance. Please try again later."
		},
		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Admin"
		},
		updatedAt: {
			type: Date,
			default: Date.now
		}
	},
	
	// Feature toggles
	features: {
		userRegistration: {
			type: Boolean,
			default: true
		},
		fileUpload: {
			type: Boolean,
			default: true
		},
		videoCalls: {
			type: Boolean,
			default: true
		},
		notifications: {
			type: Boolean,
			default: true
		}
	}
}, { timestamps: true });

// Ensure only one settings document exists
systemSettingsSchema.statics.getInstance = async function() {
	let settings = await this.findOne();
	if (!settings) {
		settings = new this();
		await settings.save();
	}
	return settings;
};

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);

export default SystemSettings; 