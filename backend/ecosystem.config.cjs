// PM2 process file for the EngageSphere backend.
//
// On the EC2 box, ensure Doppler is installed and a service token for the
// `prd` config is exported (e.g. /etc/profile.d/doppler.sh sets DOPPLER_TOKEN).
// Then start with:
//
//   doppler run --command "pm2 start ecosystem.config.cjs"
//
// or, if Doppler is configured per-project via `doppler setup`:
//
//   pm2 start ecosystem.config.cjs
//
// (Doppler's pm2 helper auto-injects env when the cwd is configured.)

module.exports = {
	apps: [
		{
			name: "engagesphere-backend",
			script: "./server.js",
			cwd: __dirname,
			instances: 1,
			exec_mode: "fork",
			watch: false,
			env: {
				NODE_ENV: "production",
				PORT: process.env.ENGAGESPHERE_PORT || 5050,
			},
			max_memory_restart: "400M",
			error_file: "./logs/pm2-error.log",
			out_file: "./logs/pm2-out.log",
			merge_logs: true,
			time: true,
		},
	],
};
