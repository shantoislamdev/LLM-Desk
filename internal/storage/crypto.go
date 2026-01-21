package storage

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"io"

	"golang.org/x/crypto/pbkdf2"
)

const (
	saltSize   = 16
	keySize    = 32 // AES-256
	iterations = 100000
)

// Encrypt encrypts data using a passphrase with AES-GCM
func Encrypt(data []byte, passphrase string) ([]byte, error) {
	// 1. Generate salt
	salt := make([]byte, saltSize)
	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return nil, fmt.Errorf("failed to generate salt: %w", err)
	}

	// 2. Derive key using PBKDF2
	key := pbkdf2.Key([]byte(passphrase), salt, iterations, keySize, sha256.New)

	// 3. Create AES cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	// 4. Create GCM
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create gcm: %w", err)
	}

	// 5. Create nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	// 6. Seal (encrypt)
	ciphertext := gcm.Seal(nil, nonce, data, nil)

	// 7. Combine: salt + nonce + ciphertext
	result := append(salt, nonce...)
	result = append(result, ciphertext...)

	return result, nil
}

// Decrypt decrypts data using a passphrase with AES-GCM
func Decrypt(encryptedData []byte, passphrase string) ([]byte, error) {
	if len(encryptedData) < saltSize+12 { // basic check for salt + nonce (usually 12 for GCM)
		return nil, fmt.Errorf("invalid encrypted data")
	}

	// 1. Extract salt and nonce
	salt := encryptedData[:saltSize]
	remaining := encryptedData[saltSize:]

	// 2. Derive key
	key := pbkdf2.Key([]byte(passphrase), salt, iterations, keySize, sha256.New)

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create gcm: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(remaining) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce := remaining[:nonceSize]
	ciphertext := remaining[nonceSize:]

	// 3. Open (decrypt)
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("decryption failed (wrong passphrase?): %w", err)
	}

	return plaintext, nil
}
