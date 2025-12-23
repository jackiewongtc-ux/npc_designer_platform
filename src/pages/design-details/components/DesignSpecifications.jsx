import React from 'react';
import Icon from '../../../components/AppIcon';

const DesignSpecifications = ({ specifications = {} }) => {
  const {
    materials = [],
    fabricComposition = "",
    category = "",
    productionType = "",
    availableSizes = [],
    colors = [],
    careInstructions = []
  } = specifications;

  const specSections = [
    {
      title: "Materials",
      icon: "Layers",
      content: materials?.length > 0 ? materials?.join(", ") : "Not specified"
    },
    {
      title: "Fabric Composition",
      icon: "Shirt",
      content: fabricComposition || "Not specified"
    },
    {
      title: "Category",
      icon: "Tag",
      content: category || "Not specified"
    },
    {
      title: "Production Type",
      icon: "Factory",
      content: productionType || "Not specified"
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Icon name="FileText" size={20} />
        Design Specifications
      </h3>
      <div className="space-y-4">
        {specSections?.map((section, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Icon name={section?.icon} size={16} />
              {section?.title}
            </div>
            <p className="text-sm text-foreground pl-6">
              {section?.content}
            </p>
          </div>
        ))}

        {availableSizes?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Icon name="Ruler" size={16} />
              Available Sizes
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {availableSizes?.map((size, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-muted rounded-md text-sm font-medium text-foreground"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>
        )}

        {colors?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Icon name="Palette" size={16} />
              Available Colors
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {colors?.map((color, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-muted rounded-md text-sm font-medium text-foreground"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>
        )}

        {careInstructions?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Icon name="Info" size={16} />
              Care Instructions
            </div>
            <ul className="space-y-1 pl-6">
              {careInstructions?.map((instruction, index) => (
                <li key={index} className="text-sm text-foreground flex items-start gap-2">
                  <Icon name="Check" size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignSpecifications;