import React from 'react';
import { Button } from '../Button';
import { FaPlus, FaEdit, FaTrash, FaDownload } from 'react-icons/fa';

export const ButtonExample: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Button Component Examples</h2>
      
      {/* Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Variants</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sizes</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <FaPlus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* With Icons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">With Icons</h3>
        <div className="flex flex-wrap gap-2">
          <Button className="flex items-center gap-2">
            <FaPlus className="w-4 h-4" />
            Create New
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <FaEdit className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="destructive" className="flex items-center gap-2">
            <FaTrash className="w-4 h-4" />
            Delete
          </Button>
          <Button variant="secondary" className="flex items-center gap-2">
            <FaDownload className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Disabled State */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Disabled State</h3>
        <div className="flex flex-wrap gap-2">
          <Button disabled>Disabled Default</Button>
          <Button variant="outline" disabled>Disabled Outline</Button>
          <Button variant="destructive" disabled>Disabled Destructive</Button>
        </div>
      </div>

      {/* Interactive Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Interactive Examples</h3>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => alert('Button clicked!')}
            className="flex items-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Click Me
          </Button>
          <Button 
            variant="outline"
            onClick={() => console.log('Outline button clicked')}
          >
            Console Log
          </Button>
        </div>
      </div>
    </div>
  );
};
