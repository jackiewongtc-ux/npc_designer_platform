import React from 'react';
import Icon from '../../../components/AppIcon';

const ProductionTimeline = ({ timeline = [] }) => {
  const defaultTimeline = [
    {
      stage: "Pre-order Phase",
      status: "active",
      description: "Collecting pre-orders from community",
      estimatedDate: "Dec 20, 2025",
      icon: "ShoppingCart"
    },
    {
      stage: "Production Start",
      status: "pending",
      description: "Manufacturing begins after minimum orders reached",
      estimatedDate: "Jan 5, 2026",
      icon: "Factory"
    },
    {
      stage: "Quality Control",
      status: "pending",
      description: "Inspection and quality assurance",
      estimatedDate: "Jan 25, 2026",
      icon: "CheckCircle"
    },
    {
      stage: "Shipping",
      status: "pending",
      description: "Delivery to customers worldwide",
      estimatedDate: "Feb 10, 2026",
      icon: "Truck"
    }
  ];

  const stages = timeline?.length > 0 ? timeline : defaultTimeline;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'var(--color-success)';
      case 'active':
        return 'var(--color-accent)';
      case 'pending':
        return 'var(--color-muted-foreground)';
      default:
        return 'var(--color-muted-foreground)';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Icon name="Calendar" size={20} />
        Production Timeline
      </h3>
      <div className="space-y-6">
        {stages?.map((stage, index) => (
          <div key={index} className="relative">
            {index < stages?.length - 1 && (
              <div 
                className="absolute left-5 top-12 w-0.5 h-full -ml-px"
                style={{ backgroundColor: 'var(--color-border)' }}
              />
            )}
            
            <div className="flex gap-4">
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2"
                style={{ 
                  borderColor: getStatusColor(stage?.status),
                  backgroundColor: stage?.status === 'active' ? getStatusColor(stage?.status) : 'var(--color-card)'
                }}
              >
                <Icon 
                  name={stage?.icon} 
                  size={18} 
                  color={stage?.status === 'active' ? 'white' : getStatusColor(stage?.status)}
                />
              </div>

              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground">{stage?.stage}</h4>
                  <span className="text-sm text-muted-foreground">
                    {stage?.estimatedDate}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stage?.description}
                </p>
                {stage?.status === 'active' && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                    <Icon name="Clock" size={12} />
                    In Progress
                  </div>
                )}
                {stage?.status === 'completed' && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                    <Icon name="Check" size={12} />
                    Completed
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductionTimeline;