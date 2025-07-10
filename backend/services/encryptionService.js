import forge from 'node-forge';

class EncryptionService {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keySize = 256;
        this.ivSize = 12;
        this.tagSize = 16;
    }

    /**
     * Generate a new key pair for a user
     * @returns {Object} Public and private key pair
     */
    generateKeyPair() {
        try {
            // Generate RSA key pair
            const rsa = forge.pki.rsa;
            const keypair = rsa.generateKeyPair({ bits: 2048 });
            
            // Convert to PEM format
            const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
            const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
            
            return {
                publicKey: publicKeyPem,
                privateKey: privateKeyPem
            };
        } catch (error) {
            console.error('Error generating key pair:', error);
            throw new Error('Failed to generate encryption keys');
        }
    }

    /**
     * Generate a random AES key for message encryption
     * @returns {string} Base64 encoded AES key
     */
    generateAESKey() {
        try {
            const key = forge.random.getBytesSync(32); // 256 bits
            return forge.util.encode64(key);
        } catch (error) {
            console.error('Error generating AES key:', error);
            throw new Error('Failed to generate AES key');
        }
    }

    /**
     * Encrypt a message with AES-GCM
     * @param {string} message - Plain text message
     * @param {string} aesKey - Base64 encoded AES key
     * @returns {Object} Encrypted message with IV and tag
     */
    encryptMessage(message, aesKey) {
        try {
            // Decode the AES key
            const keyBytes = forge.util.decode64(aesKey);
            
            // Generate random IV
            const iv = forge.random.getBytesSync(this.ivSize);
            
            // Create cipher
            const cipher = forge.cipher.createCipher(this.algorithm, keyBytes);
            cipher.start({ iv: iv });
            cipher.update(forge.util.createBuffer(message, 'utf8'));
            cipher.finish();
            
            // Get encrypted data and tag
            const encrypted = cipher.output;
            const tag = cipher.mode.tag;
            
            return {
                encrypted: forge.util.encode64(encrypted.getBytes()),
                iv: forge.util.encode64(iv),
                tag: forge.util.encode64(tag.getBytes())
            };
        } catch (error) {
            console.error('Error encrypting message:', error);
            throw new Error('Failed to encrypt message');
        }
    }

    /**
     * Decrypt a message with AES-GCM
     * @param {Object} encryptedData - Object containing encrypted, iv, and tag
     * @param {string} aesKey - Base64 encoded AES key
     * @returns {string} Decrypted message
     */
    decryptMessage(encryptedData, aesKey) {
        try {
            // Decode the AES key
            const keyBytes = forge.util.decode64(aesKey);
            
            // Decode encrypted data
            const encrypted = forge.util.decode64(encryptedData.encrypted);
            const iv = forge.util.decode64(encryptedData.iv);
            const tag = forge.util.decode64(encryptedData.tag);
            
            // Create decipher
            const decipher = forge.cipher.createDecipher(this.algorithm, keyBytes);
            decipher.start({ 
                iv: iv, 
                tag: forge.util.createBuffer(tag) 
            });
            decipher.update(forge.util.createBuffer(encrypted));
            
            const pass = decipher.finish();
            if (!pass) {
                throw new Error('Decryption failed - invalid tag');
            }
            
            return decipher.output.toString('utf8');
        } catch (error) {
            console.error('Error decrypting message:', error);
            throw new Error('Failed to decrypt message');
        }
    }

    /**
     * Encrypt AES key with recipient's public key
     * @param {string} aesKey - Base64 encoded AES key
     * @param {string} publicKeyPem - Recipient's public key in PEM format
     * @returns {string} Encrypted AES key
     */
    encryptAESKey(aesKey, publicKeyPem) {
        try {
            // Parse public key
            const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
            
            // Decode AES key
            const keyBytes = forge.util.decode64(aesKey);
            
            // Encrypt with RSA
            const encrypted = publicKey.encrypt(keyBytes, 'RSAES-PKCS1-V1_5');
            
            return forge.util.encode64(encrypted);
        } catch (error) {
            console.error('Error encrypting AES key:', error);
            throw new Error('Failed to encrypt AES key');
        }
    }

    /**
     * Decrypt AES key with user's private key
     * @param {string} encryptedAESKey - Encrypted AES key
     * @param {string} privateKeyPem - User's private key in PEM format
     * @returns {string} Decrypted AES key
     */
    decryptAESKey(encryptedAESKey, privateKeyPem) {
        try {
            // Parse private key
            const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
            
            // Decode encrypted AES key
            const encrypted = forge.util.decode64(encryptedAESKey);
            
            // Decrypt with RSA
            const decrypted = privateKey.decrypt(encrypted, 'RSAES-PKCS1-V1_5');
            
            return forge.util.encode64(decrypted);
        } catch (error) {
            console.error('Error decrypting AES key:', error);
            throw new Error('Failed to decrypt AES key');
        }
    }

    /**
     * Generate a secure random string for key derivation
     * @param {number} length - Length of the random string
     * @returns {string} Random string
     */
    generateRandomString(length = 32) {
        try {
            const bytes = forge.random.getBytesSync(length);
            return forge.util.encode64(bytes);
        } catch (error) {
            console.error('Error generating random string:', error);
            throw new Error('Failed to generate random string');
        }
    }

    /**
     * Hash a string using SHA-256
     * @param {string} data - Data to hash
     * @returns {string} SHA-256 hash
     */
    hashString(data) {
        try {
            const md = forge.md.sha256.create();
            md.update(data, 'utf8');
            return md.digest().toHex();
        } catch (error) {
            console.error('Error hashing string:', error);
            throw new Error('Failed to hash string');
        }
    }
}

export default new EncryptionService(); 