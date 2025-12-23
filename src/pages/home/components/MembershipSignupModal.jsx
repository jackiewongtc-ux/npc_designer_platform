import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MembershipSignupModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [selectedOffer, setSelectedOffer] = useState(null);

  if (!isOpen) return null;

  const offers = [
    {
      id: 'voucher',
      title: '2 x $6 Vouchers',
      description: 'Get two $6 vouchers to use on your future purchases. Perfect for trying out premium designs!',
      icon: 'Tag',
      color: 'var(--color-success)',
      bgColor: 'bg-success/10',
      value: '$12 Total Value',
      features: [
        'Use on any design purchase',
        'Valid for 90 days',
        'Stackable with other offers',
        'No minimum purchase required'
      ]
    },
    {
      id: 'merchandise',
      title: 'Exclusive Merchandise',
      description: 'Receive limited edition NPC Designer merchandise. Show off your community membership!',
      icon: 'Gift',
      color: 'var(--color-accent)',
      bgColor: 'bg-accent/10',
      value: 'Limited Edition',
      features: [
        'Premium quality materials',
        'Exclusive member design',
        'Free shipping worldwide',
        'Collectible item'
      ]
    }
  ];

  const handleSelectOffer = (offerId) => {
    setSelectedOffer(offerId);
  };

  const handleContinue = () => {
    if (selectedOffer) {
      // Store selected offer in session
      sessionStorage.setItem('selectedOffer', selectedOffer);
      // Navigate to registration with the selected offer
      navigate('/register', { state: { selectedOffer } });
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto border border-border"
          onClick={(e) => e?.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Icon name="Gift" size={20} color="var(--color-accent)" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Welcome Bonus
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose your signup offer
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <Icon name="X" size={20} color="var(--color-muted-foreground)" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-4">
                <Icon name="Sparkles" size={16} color="var(--color-accent)" />
                <span className="text-sm font-medium text-accent">
                  New Member Exclusive
                </span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Select Your Welcome Gift
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose one of these amazing offers when you sign up for membership today. This is a limited-time opportunity for new members!
              </p>
            </div>

            {/* Offers Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {offers?.map((offer) => (
                <div
                  key={offer?.id}
                  onClick={() => handleSelectOffer(offer?.id)}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    selectedOffer === offer?.id
                      ? 'border-accent bg-accent/5 shadow-lg scale-105'
                      : 'border-border hover:border-accent/50 hover:shadow-md'
                  }`}
                >
                  {/* Selection Indicator */}
                  {selectedOffer === offer?.id && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-lg">
                      <Icon name="Check" size={16} color="#ffffff" />
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${offer?.bgColor} flex items-center justify-center mb-4`}>
                    <Icon name={offer?.icon} size={28} color={offer?.color} />
                  </div>

                  {/* Title & Value */}
                  <div className="mb-3">
                    <h4 className="text-lg font-bold text-foreground mb-1">
                      {offer?.title}
                    </h4>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                      <span className="text-xs font-semibold text-accent">
                        {offer?.value}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4">
                    {offer?.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2">
                    {offer?.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Icon 
                          name="Check" 
                          size={16} 
                          color="var(--color-success)" 
                          className="flex-shrink-0 mt-0.5"
                        />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Terms & Action */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <Icon 
                    name="Info" 
                    size={18} 
                    color="var(--color-accent)" 
                    className="flex-shrink-0 mt-0.5"
                  />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Important:</p>
                    <p>
                      You can only select one offer per membership signup. This offer is available exclusively for new members and cannot be combined with other promotions. Terms and conditions apply.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={onClose}
                >
                  Maybe Later
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  disabled={!selectedOffer}
                  onClick={handleContinue}
                  iconName="ArrowRight"
                  iconPosition="right"
                >
                  Continue to Sign Up
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MembershipSignupModal;