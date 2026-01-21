package storage

import (
	"bytes"
	"testing"
)

func TestCrypto_EncryptDecrypt(t *testing.T) {
	data := []byte("Hello, World! This is a secret message.")
	passphrase := "my-secure-passphrase"

	// Encrypt
	encrypted, err := Encrypt(data, passphrase)
	if err != nil {
		t.Fatalf("Encryption failed: %v", err)
	}

	if bytes.Equal(data, encrypted) {
		t.Error("Encrypted data should not be equal to original data")
	}

	// Decrypt
	decrypted, err := Decrypt(encrypted, passphrase)
	if err != nil {
		t.Fatalf("Decryption failed: %v", err)
	}

	if !bytes.Equal(data, decrypted) {
		t.Errorf("Decrypted data mismatch.\nExpected: %s\nGot: %s", string(data), string(decrypted))
	}
}

func TestCrypto_WrongPassphrase(t *testing.T) {
	data := []byte("Secret")
	passphrase := "correct"
	wrongPassphrase := "wrong"

	encrypted, _ := Encrypt(data, passphrase)

	_, err := Decrypt(encrypted, wrongPassphrase)
	if err == nil {
		t.Error("Decryption with wrong passphrase should fail")
	}
}

func TestCrypto_CorruptData(t *testing.T) {
	encrypted, _ := Encrypt([]byte("data"), "pass")

	// Corrupt some bytes
	encrypted[20] ^= 0xFF

	_, err := Decrypt(encrypted, "pass")
	if err == nil {
		t.Error("Decryption of corrupted data should fail")
	}
}
