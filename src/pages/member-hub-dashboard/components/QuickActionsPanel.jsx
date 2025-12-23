import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionsPanel = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'submit-challenge',
      title: 'Submit Challenge',
      description: 'Share your design idea with the community',
      icon: 'Plus',
      color: 'var(--color-accent)',
      path: '/community-challenge-board'
    },
    {
      id: 'browse-designs',
      title: 'Browse Designs',
      description: 'Vote on active design submissions',
      icon: 'Eye',
      color: 'var(--color-success)',
      path: '/design-details'
    },
    {
      id: 'view-challenges',
      title: 'Active Challenges',
      description: 'Explore ongoing community challenges',
      icon: 'Trophy',
      color: 'var(--color-warning)',
      path: '/community-challenge-board'
    },
    {
      id: 'portfolio',
      title: 'My Portfolio',
      description: 'View your design submissions',
      icon: 'Briefcase',
      color: 'var(--color-primary)',
      path: '/member-hub-dashboard'
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions?.map((action) => (
          <button
            key={action?.id}
            onClick={() => navigate(action?.path)}
            className="p-4 rounded-lg border border-border hover:border-accent hover:bg-muted/30 transition-all duration-200 text-left group"
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: `${action?.color}20` }}
              >
                <Icon name={action?.icon} size={24} color={action?.color} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground mb-1 group-hover:text-accent transition-colors duration-200">
                  {action?.title}
                </h4>
                <p className="text-xs text-muted-foreground">{action?.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <Button 
          variant="default" 
          fullWidth 
          iconName="Sparkles" 
          iconPosition="left"
          onClick={() => navigate('/community-challenge-board')}
        >
          Explore Community
        </Button>
      </div>
    </div>
  );
};

export default QuickActionsPanel;