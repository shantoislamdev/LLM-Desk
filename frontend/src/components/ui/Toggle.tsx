import React from 'react';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
    checked,
    onChange,
    disabled = false,
    label
}) => {
    return (
        <div className="toggle-container">
            {label && <span className="toggle-label">{label}</span>}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                className={`toggle ${checked ? 'toggle--active' : ''} ${disabled ? 'toggle--disabled' : ''}`}
                onClick={() => !disabled && onChange(!checked)}
            >
                <span className="toggle__knob" />
            </button>
        </div>
    );
};
