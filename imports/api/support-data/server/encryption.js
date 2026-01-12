import { Meteor } from 'meteor/meteor';
import crypto from 'crypto';

// Use a fixed key for now (In production, this should be in settings or env)
// Using a 32-byte key for AES-256
// WARNING: If this key is lost, encrypted data cannot be recovered.
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from('12345678901234567890123456789012'); // 32 chars
const IV_LENGTH = 16;

export const Encryption = {
    encrypt(text) {
        if (!text) return text;
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
            let encrypted = cipher.update(text);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            return iv.toString('hex') + ':' + encrypted.toString('hex');
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Meteor.Error('encryption-failed', 'Failed to encrypt data');
        }
    },

    decrypt(text) {
        if (!text) return text;
        try {
            // Check if text is in valid format (iv:encrypted_text)
            const parts = text.split(':');
            if (parts.length !== 2) return text; // return raw if not encrypted format

            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = Buffer.from(parts[1], 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch (error) {
            console.error('Decryption error:', error);
            // Return original text if decryption fails (might be unencrypted legacy data)
            return text;
        }
    }
};
