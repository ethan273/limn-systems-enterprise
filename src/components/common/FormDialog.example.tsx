/**
 * FormDialog Component Usage Examples
 *
 * This file demonstrates various use cases for the FormDialog component.
 * Copy and adapt these examples to your specific needs.
 */

'use client';

import { useState } from 'react';
import { FormDialog, type FormField } from './FormDialog';
import { Button } from '@/components/ui/button';

/**
 * Example 1: Simple Contact Form
 */
export function SimpleContactFormExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const contactFields: FormField[] = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'John Doe',
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'john@example.com',
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'text',
      placeholder: '+1 (555) 123-4567',
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      required: true,
      placeholder: 'Your message here...',
    },
  ];

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Contact form submitted:', data);
      alert('Contact form submitted successfully!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Contact Form</Button>
      <FormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Contact Us"
        description="Fill out the form below and we'll get back to you soon."
        fields={contactFields}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Send Message"
      />
    </div>
  );
}

/**
 * Example 2: Customer Creation Form
 */
export function CustomerFormExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const customerFields: FormField[] = [
    {
      name: 'companyName',
      label: 'Company Name',
      type: 'text',
      required: true,
      placeholder: 'Acme Corporation',
    },
    {
      name: 'contactName',
      label: 'Contact Name',
      type: 'text',
      required: true,
      placeholder: 'Jane Smith',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'jane@acme.com',
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'text',
      placeholder: '+1 (555) 123-4567',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
      ],
      defaultValue: 'active',
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
      defaultValue: 'medium',
    },
    {
      name: 'sendWelcomeEmail',
      label: 'Send welcome email',
      type: 'checkbox',
      defaultValue: true,
    },
  ];

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual tRPC mutation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Customer created:', data);
      alert('Customer created successfully!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Add Customer</Button>
      <FormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Add New Customer"
        description="Create a new customer record in the system."
        fields={customerFields}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Create Customer"
      />
    </div>
  );
}

/**
 * Example 3: Task Creation Form with Validation
 */
export function TaskFormExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const taskFields: FormField[] = [
    {
      name: 'title',
      label: 'Task Title',
      type: 'text',
      required: true,
      placeholder: 'Complete project documentation',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Detailed task description...',
    },
    {
      name: 'assignee',
      label: 'Assignee',
      type: 'select',
      required: true,
      options: [
        { value: 'user1', label: 'John Doe' },
        { value: 'user2', label: 'Jane Smith' },
        { value: 'user3', label: 'Bob Johnson' },
      ],
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
      defaultValue: 'medium',
    },
    {
      name: 'dueDate',
      label: 'Due Date',
      type: 'date',
      required: true,
    },
    {
      name: 'estimatedHours',
      label: 'Estimated Hours',
      type: 'number',
      placeholder: '8',
      validation: {
        min: 1,
        max: 100,
        message: 'Hours must be between 1 and 100',
      },
    },
    {
      name: 'notifyAssignee',
      label: 'Notify assignee by email',
      type: 'checkbox',
      defaultValue: true,
    },
  ];

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual tRPC mutation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Task created:', data);
      alert('Task created successfully!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Create Task</Button>
      <FormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Create New Task"
        description="Add a new task to the system"
        fields={taskFields}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Create Task"
      />
    </div>
  );
}

/**
 * Example 4: User Registration with Password
 */
export function UserRegistrationExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const registrationFields: FormField[] = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'John',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'Doe',
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'john.doe@company.com',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
      placeholder: '••••••••',
      validation: {
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        message:
          'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      },
    },
    {
      name: 'department',
      label: 'Department',
      type: 'select',
      required: true,
      options: [
        { value: 'admin', label: 'Administration' },
        { value: 'design', label: 'Design' },
        { value: 'production', label: 'Production' },
        { value: 'sales', label: 'Sales' },
      ],
    },
    {
      name: 'acceptTerms',
      label: 'I accept the terms and conditions',
      type: 'checkbox',
      required: true,
    },
  ];

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual tRPC mutation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('User registered:', data);
      alert('User registered successfully!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Register User</Button>
      <FormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="User Registration"
        description="Create a new user account"
        fields={registrationFields}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Register"
      />
    </div>
  );
}

/**
 * Example 5: Integration with tRPC mutation
 *
 * This example shows how to integrate FormDialog with tRPC
 */
export function TRPCIntegrationExample() {
  const [isOpen, setIsOpen] = useState(false);

  // Example: Replace with your actual tRPC hook
  // const createCustomer = api.customers.create.useMutation({
  //   onSuccess: () => {
  //     alert('Customer created!');
  //     setIsOpen(false);
  //   },
  // });

  const customerFields: FormField[] = [
    {
      name: 'name',
      label: 'Customer Name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    },
  ];

  const handleSubmit = async (data: Record<string, unknown>) => {
    // Example: Replace with your actual tRPC mutation
    // await createCustomer.mutateAsync({
    //   name: data.name as string,
    //   email: data.email as string,
    // });

    // Simulation for this example
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Customer created via tRPC:', data);
    alert('Customer created!');
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Add Customer (tRPC)</Button>
      <FormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Add Customer"
        fields={customerFields}
        onSubmit={handleSubmit}
        // Replace with: isLoading={createCustomer.isPending}
        isLoading={false}
      />
    </div>
  );
}
