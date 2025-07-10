import User from '../models/user.model.js';
import encryptionService from './encryptionService.js';

class KeyManagementService {
    /**
     * Generate and store encryption keys for a user
     * @param {string} userId - User ID
     * @returns {Object} Generated keys
     */
    async generateUserKeys(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Generate new key pair
            const keyPair = encryptionService.generateKeyPair();

            // Update user with new keys
            user.encryptionKeys = {
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey,
                keyGeneratedAt: new Date()
            };

            await user.save();

            console.log(`Generated encryption keys for user: ${user.username}`);

            return {
                publicKey: keyPair.publicKey,
                keyGeneratedAt: user.encryptionKeys.keyGeneratedAt
            };
        } catch (error) {
            console.error('Error generating user keys:', error);
            throw error;
        }
    }

    /**
     * Get user's public key
     * @param {string} userId - User ID
     * @returns {string} Public key in PEM format
     */
    async getUserPublicKey(userId) {
        try {
            const user = await User.findById(userId).select('encryptionKeys.publicKey');
            if (!user || !user.encryptionKeys.publicKey) {
                throw new Error('Public key not found for user');
            }
            return user.encryptionKeys.publicKey;
        } catch (error) {
            console.error('Error getting user public key:', error);
            throw error;
        }
    }

    /**
     * Get user's private key (for decryption)
     * @param {string} userId - User ID
     * @returns {string} Private key in PEM format
     */
    async getUserPrivateKey(userId) {
        try {
            const user = await User.findById(userId).select('encryptionKeys.privateKey');
            if (!user || !user.encryptionKeys.privateKey) {
                throw new Error('Private key not found for user');
            }
            return user.encryptionKeys.privateKey;
        } catch (error) {
            console.error('Error getting user private key:', error);
            throw error;
        }
    }

    /**
     * Check if user has encryption keys
     * @param {string} userId - User ID
     * @returns {boolean} True if user has keys
     */
    async hasUserKeys(userId) {
        try {
            const user = await User.findById(userId).select('encryptionKeys');
            return !!(user && user.encryptionKeys && user.encryptionKeys.publicKey && user.encryptionKeys.privateKey);
        } catch (error) {
            console.error('Error checking user keys:', error);
            return false;
        }
    }

    /**
     * Rotate user's encryption keys
     * @param {string} userId - User ID
     * @returns {Object} New keys
     */
    async rotateUserKeys(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Generate new key pair
            const keyPair = encryptionService.generateKeyPair();

            // Store old keys for potential message recovery
            const oldKeys = user.encryptionKeys;

            // Update user with new keys
            user.encryptionKeys = {
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey,
                keyGeneratedAt: new Date()
            };

            await user.save();

            console.log(`Rotated encryption keys for user: ${user.username}`);

            return {
                publicKey: keyPair.publicKey,
                keyGeneratedAt: user.encryptionKeys.keyGeneratedAt,
                oldKeys
            };
        } catch (error) {
            console.error('Error rotating user keys:', error);
            throw error;
        }
    }

    /**
     * Delete user's encryption keys
     * @param {string} userId - User ID
     */
    async deleteUserKeys(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.encryptionKeys = {
                publicKey: null,
                privateKey: null,
                keyGeneratedAt: null
            };

            await user.save();

            console.log(`Deleted encryption keys for user: ${user.username}`);
        } catch (error) {
            console.error('Error deleting user keys:', error);
            throw error;
        }
    }

    /**
     * Ensure user has encryption keys, generate if missing
     * @param {string} userId - User ID
     * @returns {Object} User's public key
     */
    async ensureUserKeys(userId) {
        try {
            const hasKeys = await this.hasUserKeys(userId);
            if (!hasKeys) {
                console.log(`No encryption keys found for user ${userId}, generating new keys...`);
                return await this.generateUserKeys(userId);
            }
            
            return {
                publicKey: await this.getUserPublicKey(userId),
                keyGeneratedAt: (await User.findById(userId).select('encryptionKeys.keyGeneratedAt')).encryptionKeys.keyGeneratedAt
            };
        } catch (error) {
            console.error('Error ensuring user keys:', error);
            throw error;
        }
    }
}

export default new KeyManagementService(); 