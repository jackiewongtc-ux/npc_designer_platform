import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SystemAlertsPanel = ({ alerts, onDismiss, onViewAll }) => {
  const getAlertIcon = (type) => {
    const icons = {
      urgent: { name: 'AlertTriangle', color: 'var(--color-error)' },
      warning: { name: 'AlertCircle', color: 'var(--color-warning)' },
      info: { name: 'Info', color: 'var(--color-accent)' }
    };
    return icons?.[type] || icons?.info;
  };

  const getAlertStyle = (type) => {
    const styles = {
      urgent: 'bg-error/10 border-error/20',
      warning: 'bg-warning/10 border-warning/20',
      info: 'bg-accent/10 border-accent/20'
    };
    return styles?.[type] || styles?.info;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Icon name="Bell" size={20} />
          System Alerts
        </h3>
        {alerts?.length > 3 && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {alerts?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="CheckCircle" size={48} color="var(--color-success)" className="mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No pending alerts</p>
          </div>
        ) : (
          alerts?.slice(0, 3)?.map((alert) => {
            const icon = getAlertIcon(alert?.type);
            return (
              <div
                key={alert?.id}
                className={`border rounded-lg p-4 ${getAlertStyle(alert?.type)}`}
              >
                <div className="flex items-start gap-3">
                  <Icon name={icon?.name} size={20} color={icon?.color} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1">{alert?.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">{alert?.message}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{alert?.time}</span>
                      {alert?.actionLabel && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => alert?.onAction(alert?.id)}
                        >
                          {alert?.actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDismiss(alert?.id)}
                    className="p-1 rounded hover:bg-background/50 transition-colors duration-150 flex-shrink-0"
                  >
                    <Icon name="X" size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SystemAlertsPanel;