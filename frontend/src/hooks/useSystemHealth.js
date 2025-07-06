import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../context/AuthContext";

const useSystemHealth = () => {
	const [healthData, setHealthData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [lastUpdated, setLastUpdated] = useState(null);
	const { admin } = useAuthContext();

	const fetchHealthData = useCallback(async () => {
		if (!admin) return;

		setLoading(true);
		setError(null);
		
		try {
			const res = await fetch("/api/admin/health", {
				credentials: "include"
			});
			
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
			
			const data = await res.json();
			setHealthData(data);
			setLastUpdated(new Date());
		} catch (error) {
			console.error("Error fetching system health:", error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	}, [admin]);

	// Auto-refresh every 30 seconds
	useEffect(() => {
		if (!admin) return;

		fetchHealthData();

		const interval = setInterval(fetchHealthData, 30000); // 30 seconds

		return () => clearInterval(interval);
	}, [admin, fetchHealthData]);

	// Manual refresh function
	const refreshHealth = () => {
		fetchHealthData();
	};

	// Get overall status
	const getOverallStatus = () => {
		if (!healthData) return 'unknown';
		return healthData.overall;
	};

	// Get service status
	const getServiceStatus = (serviceName) => {
		if (!healthData?.services) return 'unknown';
		return healthData.services[serviceName]?.status || 'unknown';
	};

	// Get unhealthy services
	const getUnhealthyServices = () => {
		if (!healthData?.services) return [];
		
		return Object.entries(healthData.services)
			.filter(([name, service]) => service.status === 'unhealthy')
			.map(([name, service]) => ({
				name,
				...service
			}));
	};

	// Get healthy services
	const getHealthyServices = () => {
		if (!healthData?.services) return [];
		
		return Object.entries(healthData.services)
			.filter(([name, service]) => service.status === 'healthy')
			.map(([name, service]) => ({
				name,
				...service
			}));
	};

	// Format uptime
	const formatUptime = (seconds) => {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		
		if (days > 0) return `${days}d ${hours}h ${minutes}m`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	};

	// Format memory usage
	const formatMemoryUsage = (bytes) => {
		const mb = bytes / 1024 / 1024;
		return `${mb.toFixed(2)} MB`;
	};

	return {
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
	};
};

export default useSystemHealth; 