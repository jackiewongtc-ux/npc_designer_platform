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
  }];


  return;







































};

export default QuickActionsPanel;