import { useState } from "react";
import useSystemHealth from "../../hooks/useSystemHealth";

const SystemHealthPanel = () => {
	const {
		healthData,
		loading,
		error,
		lastUpdated,
		refreshHealth,
		getOverallStatus,
		getServiceStatus,
		getUnhealthyServices,
		getHealthyServices,
		formatUptime,
		formatMemoryUsage
	} = useSystemHealth();

	const [showDetails, setShowDetails] = useState(false);

	const getStatusColor = (status) => {
		switch (status) {
			case 'healthy':
				return 'text-green-400 bg-green-900/20 border-green-500';
			case 'unhealthy':
				return 'text-red-400 bg-red-900/20 border-red-500';
			case 'error':
				return 'text-red-400 bg-red-900/20 border-red-500';
			default:
				return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case 'healthy':
				return (
					<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
					</svg>
				);
			case 'unhealthy':
			case 'error':
				return (
					<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
					</svg>
				);
			default:
				return (
					<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
					</svg>
				);
		}
	};

	const ServiceCard = ({ name, service }) => (
		<div className={`p-4 rounded-lg border ${getStatusColor(service.status)}`}>
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					{getStatusIcon(service.status)}
					<div>
						<h4 className="font-semibold capitalize">{name}</h4>
						<p className="text-sm opacity-80">{service.message}</p>
						{service.responseTime && (
							<p className="text-xs opacity-60">{service.responseTime}ms</p>
						)}
					</div>
				</div>
				<div className="text-right">
					<span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
						service.status === 'healthy' ? 'bg-green-900/30 text-green-300' :
						service.status === 'unhealthy' ? 'bg-red-900/30 text-red-300' :
						'bg-yellow-900/30 text-yellow-300'
					}`}>
						{service.status}
					</span>
				</div>
			</div>
			{service.error && (
				<div className="mt-2 p-2 bg-red-900/20 rounded text-xs text-red-300">
					<strong>Error:</strong> {service.error}
				</div>
			)}
		</div>
	);

	if (loading && !healthData) {
		return (
			<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
				<div className="flex items-center justify-center">
					<svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<span className="ml-2 text-gray-300">Loading system health...</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
				<div className="text-center">
					<div className="text-red-400 mb-2">Failed to load system health</div>
					<div className="text-sm text-gray-400 mb-4">{error}</div>
					<button
						onClick={refreshHealth}
						className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	const overallStatus = getOverallStatus();
	const unhealthyServices = getUnhealthyServices();
	const healthyServices = getHealthyServices();

	return (
		<div className="bg-gray-800 rounded-lg border border-gray-700">
			{/* Header */}
			<div className="px-6 py-4 border-b border-gray-700">
				<div className="flex justify-between items-center">
					<div className="flex items-center space-x-3">
						<h2 className="text-xl font-semibold text-white">System Health</h2>
						<div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(overallStatus)}`}>
							{getStatusIcon(overallStatus)}
							<span className="capitalize">{overallStatus}</span>
						</div>
					</div>
					<div className="flex items-center space-x-3">
						{lastUpdated && (
							<span className="text-sm text-gray-400">
								Last updated: {lastUpdated.toLocaleTimeString()}
							</span>
						)}
						<button
							onClick={refreshHealth}
							disabled={loading}
							className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-1"
						>
							{loading ? (
								<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							) : (
								<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
							)}
							<span>{loading ? 'Refreshing...' : 'Refresh'}</span>
						</button>
						<button
							onClick={() => setShowDetails(!showDetails)}
							className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded-md text-sm font-medium"
						>
							{showDetails ? 'Hide Details' : 'Show Details'}
						</button>
					</div>
				</div>
			</div>

			<div className="p-6">
				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div className="bg-gray-700 p-4 rounded-lg">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-400">Overall Status</p>
								<p className={`text-lg font-semibold capitalize ${overallStatus === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
									{overallStatus}
								</p>
							</div>
							{getStatusIcon(overallStatus)}
						</div>
					</div>

					<div className="bg-gray-700 p-4 rounded-lg">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-400">Healthy Services</p>
								<p className="text-lg font-semibold text-green-400">{healthyServices.length}</p>
							</div>
							<svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
							</svg>
						</div>
					</div>

					<div className="bg-gray-700 p-4 rounded-lg">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-400">Issues</p>
								<p className="text-lg font-semibold text-red-400">{unhealthyServices.length}</p>
							</div>
							<svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
						</div>
					</div>
				</div>

				{/* Issues Section */}
				{unhealthyServices.length > 0 && (
					<div className="mb-6">
						<h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center">
							<svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
							</svg>
							Issues Found ({unhealthyServices.length})
						</h3>
						<div className="space-y-3">
							{unhealthyServices.map((service) => (
								<ServiceCard key={service.name} name={service.name} service={service} />
							))}
						</div>
					</div>
				)}

				{/* Detailed View */}
				{showDetails && (
					<div>
						<h3 className="text-lg font-semibold text-white mb-3">All Services</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
							{Object.entries(healthData?.services || {}).map(([name, service]) => (
								<ServiceCard key={name} name={name} service={service} />
							))}
						</div>

						{/* System Information */}
						{healthData?.system && (
							<div className="bg-gray-700 p-4 rounded-lg">
								<h4 className="text-md font-semibold text-white mb-3">System Information</h4>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
									<div>
										<p className="text-gray-400">Node Version</p>
										<p className="text-white">{healthData.system.nodeVersion}</p>
									</div>
									<div>
										<p className="text-gray-400">Platform</p>
										<p className="text-white">{healthData.system.platform}</p>
									</div>
									<div>
										<p className="text-gray-400">Uptime</p>
										<p className="text-white">{formatUptime(healthData.system.uptime)}</p>
									</div>
									<div>
										<p className="text-gray-400">Environment</p>
										<p className="text-white capitalize">{healthData.system.environment}</p>
									</div>
									<div>
										<p className="text-gray-400">Memory Usage</p>
										<p className="text-white">{formatMemoryUsage(healthData.system.memoryUsage.heapUsed)}</p>
									</div>
									<div>
										<p className="text-gray-400">Heap Total</p>
										<p className="text-white">{formatMemoryUsage(healthData.system.memoryUsage.heapTotal)}</p>
									</div>
									<div>
										<p className="text-gray-400">External</p>
										<p className="text-white">{formatMemoryUsage(healthData.system.memoryUsage.external)}</p>
									</div>
									<div>
										<p className="text-gray-400">RSS</p>
										<p className="text-white">{formatMemoryUsage(healthData.system.memoryUsage.rss)}</p>
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default SystemHealthPanel; 