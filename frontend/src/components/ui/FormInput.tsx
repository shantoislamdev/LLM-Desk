import React from 'react';

interface FormInputProps {
    label: string;
    name: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: 'text' | 'number' | 'url';
    placeholder?: string;
    required?: boolean;
    error?: string;
    helperText?: string;
    disabled?: boolean;
    readOnly?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    name,
    value,
    onChange,
    type = 'text',
    placeholder,
    required = false,
    error,
    helperText,
    disabled = false,
    readOnly = false
}) => {
    return (
        <div className="form-group">
            <label htmlFor={name} className="form-label">
                {label}
                {required && <span className="u-text-accent"> *</span>}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                className={`input ${error ? 'input--error' : ''} ${readOnly ? 'input--readonly' : ''}`}
            />
            {error && <span className="form-error">{error}</span>}
            {helperText && !error && <span className="form-helper">{helperText}</span>}
        </div>
    );
};
