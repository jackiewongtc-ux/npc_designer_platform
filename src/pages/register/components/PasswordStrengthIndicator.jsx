import React from 'react';

const PasswordStrengthIndicator = ({ password }) => {
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (pwd?.length >= 8) score++;
    if (pwd?.length >= 12) score++;
    if (/[a-z]/?.test(pwd) && /[A-Z]/?.test(pwd)) score++;
    if (/\d/?.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/?.test(pwd)) score++;

    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Weak', color: 'bg-error' },
      { score: 2, label: 'Fair', color: 'bg-warning' },
      { score: 3, label: 'Good', color: 'bg-accent' },
      { score: 4, label: 'Strong', color: 'bg-success' },
      { score: 5, label: 'Very Strong', color: 'bg-success' }
    ];

    return levels?.[score];
  };

  const strength = calculateStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5]?.map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              level <= strength?.score ? strength?.color : 'bg-muted'
            }`}
          />
        ))}
      </div>
      {strength?.label && (
        <p className="text-xs text-muted-foreground">
          Password strength: <span className="font-medium">{strength?.label}</span>
        </p>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;