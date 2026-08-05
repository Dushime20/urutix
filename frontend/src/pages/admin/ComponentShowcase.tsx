import React, { useState } from 'react';
import { FaSave, FaUser, FaEnvelope, FaLock, FaCheck, FaTimes } from 'react-icons/fa';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { DataCard, Button, Modal, Input, Select, Textarea } from '../../components/EnliteUI';
import { TranslatedText } from '../../components/translated-text';

const ComponentShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    message: '',
  });

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' },
    { value: 'manager', label: 'Manager' },
  ];

  return (
    <AdminPageLayout
      title={<TranslatedText text="Component Showcase" />}
      description={<TranslatedText text="Explore all Enlite UI components" />}
    >
      <div className="space-y-6">
        {/* Buttons Section */}
        <DataCard
          title={<TranslatedText text="Buttons" />}
          subtitle={<TranslatedText text="Various button styles and variants" />}
          headerColor="primary"
        >
          <div className="space-y-6">
            {/* Primary Variants */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3"><TranslatedText text="Color Variants" /></h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary"><TranslatedText text="Primary" /></Button>
                <Button variant="secondary"><TranslatedText text="Secondary" /></Button>
                <Button variant="success"><TranslatedText text="Success" /></Button>
                <Button variant="warning"><TranslatedText text="Warning" /></Button>
                <Button variant="error"><TranslatedText text="Error" /></Button>
                <Button variant="info"><TranslatedText text="Info" /></Button>
                <Button variant="outline"><TranslatedText text="Outline" /></Button>
                <Button variant="ghost"><TranslatedText text="Ghost" /></Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3"><TranslatedText text="Sizes" /></h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="primary"><TranslatedText text="Small" /></Button>
                <Button size="md" variant="primary"><TranslatedText text="Medium" /></Button>
                <Button size="lg" variant="primary"><TranslatedText text="Large" /></Button>
              </div>
            </div>

            {/* With Icons */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3"><TranslatedText text="With Icons" /></h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="success" icon={<FaSave />}>
                  <TranslatedText text="Save" />
                </Button>
                <Button variant="primary" icon={<FaUser />} iconPosition="right">
                  <TranslatedText text="Profile" />
                </Button>
                <Button variant="error" icon={<FaTimes />}>
                  <TranslatedText text="Cancel" />
                </Button>
              </div>
            </div>

            {/* States */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3"><TranslatedText text="States" /></h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" loading>
                  <TranslatedText text="Loading..." />
                </Button>
                <Button variant="secondary" disabled>
                  <TranslatedText text="Disabled" />
                </Button>
                <Button variant="success" fullWidth>
                  <TranslatedText text="Full Width" />
                </Button>
              </div>
            </div>
          </div>
        </DataCard>

        {/* Form Components Section */}
        <DataCard
          title={<TranslatedText text="Form Components" />}
          subtitle={<TranslatedText text="Input fields, selects, and textareas" />}
          headerColor="success"
        >
          <div className="space-y-6">
            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Enter your name"
                icon={<FaUser />}
                helperText="Your full legal name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                icon={<FaEnvelope />}
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter password"
                icon={<FaLock />}
                helperText="At least 8 characters"
              />

              <Input
                label="With Error"
                placeholder="Invalid input"
                error="This field is required"
              />
            </div>

            {/* Select */}
            <Select
              label="User Role"
              options={roleOptions}
              placeholder="Select a role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              helperText="Choose the appropriate role"
            />

            {/* Textarea */}
            <Textarea
              label="Message"
              placeholder="Enter your message here..."
              rows={4}
              showCharCount
              maxLength={500}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              helperText="Describe your request in detail"
            />

            {/* Form Actions */}
            <div className="flex gap-3">
              <Button variant="primary" icon={<FaSave />}>
                Save Changes
              </Button>
              <Button variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DataCard>

        {/* Modals Section */}
        <DataCard
          title="Modals"
          subtitle="Dialog boxes and overlays"
          headerColor="info"
        >
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Open Default Modal
            </Button>
            <Button variant="success" onClick={() => setIsSuccessModalOpen(true)}>
              Open Success Modal
            </Button>
          </div>
        </DataCard>
      </div>

      {/* Default Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={<FaCheck />}>
              Confirm
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-slate-300">
            This is a default modal with a header, content area, and footer.
          </p>
          
          <Input
            label="Name"
            placeholder="Enter name"
            icon={<FaUser />}
          />
          
          <Select
            label="Category"
            options={[
              { value: '1', label: 'Category 1' },
              { value: '2', label: 'Category 2' },
            ]}
            placeholder="Select category"
          />
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Success!"
        size="sm"
        headerColor="success"
        footer={
          <Button 
            variant="success" 
            fullWidth 
            onClick={() => setIsSuccessModalOpen(false)}
          >
            Got it!
          </Button>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-3xl text-green-600" />
          </div>
          <p className="text-gray-600 dark:text-slate-300">
            Your action was completed successfully!
          </p>
        </div>
      </Modal>
    </AdminPageLayout>
  );
};

export default ComponentShowcase;
