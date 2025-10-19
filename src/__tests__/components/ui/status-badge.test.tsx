/**
 * StatusBadge Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/ui/status-badge';

describe('StatusBadge', () => {
 it('should render with pending status', () => {
 render(<StatusBadge status="pending" />);
 expect(screen.getByText('Pending')).toBeInTheDocument();
 });

 it('should render with in_progress status and format correctly', () => {
 render(<StatusBadge status="in_progress" />);
 expect(screen.getByText('In Progress')).toBeInTheDocument();
 });

 it('should use custom label when provided', () => {
 render(<StatusBadge status="pending" label="Awaiting Approval" />);
 expect(screen.getByText('Awaiting Approval')).toBeInTheDocument();
 });

 it('should apply correct color classes for success status', () => {
 const { container } = render(<StatusBadge status="success" />);
 const badge = container.firstChild;
 expect(badge).toHaveClass('bg-success');
 expect(badge).toHaveClass('text-success');
 expect(badge).toHaveClass('border-success');
 });

 it('should apply correct color classes for error status', () => {
 const { container } = render(<StatusBadge status="error" />);
 const badge = container.firstChild;
 expect(badge).toHaveClass('bg-destructive');
 expect(badge).toHaveClass('text-destructive');
 expect(badge).toHaveClass('border-destructive');
 });

 it('should handle unknown statuses with default info styling', () => {
 const { container } = render(<StatusBadge status="unknown_status" />);
 const badge = container.firstChild;
 expect(badge).toHaveClass('bg-info');
 expect(badge).toHaveClass('text-info');
 expect(badge).toHaveClass('border-info');
 });
});
