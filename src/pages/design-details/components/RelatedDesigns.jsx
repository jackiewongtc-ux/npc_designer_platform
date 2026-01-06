import React from 'react';
import { Link } from 'react-router-dom';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';

const RelatedDesigns = ({ currentDesignId, category = "Apparel" }) => {
  const relatedDesigns = [
  {
    id: 2,
    title: "Urban Street Jacket",
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1a8db4ab1-1764738369924.png",
    imageAlt: "Modern black urban street jacket with asymmetric zipper design displayed on white background",
    designer: "Alex Rivera",
    votes: 342,
    price: 89.99,
    status: "voting"
  },
  {
    id: 3,
    title: "Minimalist Tote Bag",
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_12e3fa5ba-1765572948306.png",
    imageAlt: "Beige minimalist canvas tote bag with leather handles on wooden surface",
    designer: "Emma Watson",
    votes: 289,
    price: 45.00,
    status: "pre-order"
  },
  {
    id: 4,
    title: "Eco-Friendly Sneakers",
    image: "https://images.unsplash.com/photo-1708828257079-8a6277bc1c3a",
    imageAlt: "White sustainable sneakers made from recycled materials on gray concrete floor",
    designer: "Jordan Lee",
    votes: 456,
    price: 120.00,
    status: "voting"
  },
  {
    id: 5,
    title: "Vintage Denim Jacket",
    image: "https://images.unsplash.com/photo-1721218784730-642cad714ee5",
    imageAlt: "Classic blue vintage denim jacket with distressed details hanging on wooden hanger",
    designer: "Sofia Martinez",
    votes: 378,
    price: 95.00,
    status: "pre-order"
  }];


  const getStatusBadge = (status) => {
    if (status === 'voting') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium">
          <Icon name="TrendingUp" size={12} />
          Voting
        </span>);

    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-xs font-medium">
        <Icon name="ShoppingCart" size={12} />
        Pre-order
      </span>);

  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Icon name="Grid3x3" size={20} />
        Related Designs
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {relatedDesigns?.map((design) =>
        <Link
          key={design?.id}
          to={`/design-details?id=${design?.id}`}
          className="group bg-muted/30 rounded-lg overflow-hidden border border-border hover:border-accent transition-all duration-200 no-underline">

            <div className="relative h-48 overflow-hidden">
              <Image
              src={design?.image}
              alt={design?.imageAlt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />

              <div className="absolute top-2 right-2">
                {getStatusBadge(design?.status)}
              </div>
            </div>

            <div className="p-4 space-y-2">
              <h4 className="font-semibold text-foreground group-hover:text-accent transition-colors duration-200">
                {design?.title}
              </h4>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{design?.designer}</span>
                <span className="font-semibold text-foreground font-data">
                  ${design?.price?.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Icon name="TrendingUp" size={14} />
                <span>{design?.votes} votes</span>
              </div>
            </div>
          </Link>
        )}
      </div>
      <div className="pt-4 border-t border-border">
        <Link
          to="/discover"
          className="flex items-center justify-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors duration-200 no-underline">

          <span>Explore More Designs</span>
          <Icon name="ArrowRight" size={16} />
        </Link>
      </div>
    </div>);

};

export default RelatedDesigns;