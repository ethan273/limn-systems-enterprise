-- Notification Seeding Script
-- Purpose: Create realistic test notifications for testing the bell icon functionality
-- Date: 2025-10-04
-- User: daniel@limn.us.com (f985b324-7d8d-4e0a-be15-325fd5ea89fd)

-- Insert varied test notifications (mix of read/unread, different types, realistic timestamps)

-- Unread notifications (recent)
INSERT INTO public.notifications (user_id, type, title, message, link, entity_type, entity_id, read_at, created_at)
VALUES
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'task_assigned', 'New Task Assigned', 'You have been assigned to "Review Q4 Production Schedule"', '/tasks/12345678-1234-1234-1234-123456789012', 'task', '12345678-1234-1234-1234-123456789012', NULL, NOW() - INTERVAL '5 minutes'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'task_mentioned', 'Mentioned in Task', '@daniel mentioned you in "Client Meeting Follow-up"', '/tasks/23456789-2345-2345-2345-234567890123', 'task', '23456789-2345-2345-2345-234567890123', NULL, NOW() - INTERVAL '15 minutes'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'order_status', 'Order Status Update', 'Order #PO-2024-001 status changed to "In Production"', '/orders/34567890-3456-3456-3456-345678901234', 'order', '34567890-3456-3456-3456-345678901234', NULL, NOW() - INTERVAL '30 minutes'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'payment_received', 'Payment Received', 'Payment of $15,000 received for Invoice #INV-2024-045', '/invoices/45678901-4567-4567-4567-456789012345', 'invoice', '45678901-4567-4567-4567-456789012345', NULL, NOW() - INTERVAL '1 hour'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'production_milestone', 'Production Milestone Reached', 'Fabric cutting completed for Project "Luxury Hotel Suite"', '/production/56789012-5678-5678-5678-567890123456', 'production_order', '56789012-5678-5678-5678-567890123456', NULL, NOW() - INTERVAL '2 hours');

-- Read notifications (older)
INSERT INTO public.notifications (user_id, type, title, message, link, entity_type, entity_id, read_at, created_at)
VALUES
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'task_completed', 'Task Completed', 'Task "Finalize Shop Drawings" has been marked as complete', '/tasks/67890123-6789-6789-6789-678901234567', 'task', '67890123-6789-6789-6789-678901234567', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '4 hours'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'order_shipped', 'Order Shipped', 'Order #PO-2024-002 has been shipped - Tracking: TRK123456789', '/shipping/78901234-7890-7890-7890-789012345678', 'order', '78901234-7890-7890-7890-789012345678', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'design_approved', 'Design Approved', 'Client approved design for "Modern Office Furniture Collection"', '/design/89012345-8901-8901-8901-890123456789', 'design_project', '89012345-8901-8901-8901-890123456789', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'qc_issue', 'QC Issue Reported', 'Quality control issue reported for Production Order #PRD-2024-015', '/qc/90123456-9012-9012-9012-901234567890', 'production_order', '90123456-9012-9012-9012-901234567890', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'document_uploaded', 'Document Uploaded', 'New shop drawing uploaded: "Living Room Sofa - Final.pdf"', '/documents/01234567-0123-0123-0123-012345678901', 'document', '01234567-0123-0123-0123-012345678901', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days');

-- Additional varied notifications
INSERT INTO public.notifications (user_id, type, title, message, link, entity_type, entity_id, read_at, created_at)
VALUES
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'client_message', 'New Client Message', 'Sarah Johnson sent you a message about Project #PRJ-2024-008', '/messages/12345678-0000-0000-0000-000000000001', 'message', '12345678-0000-0000-0000-000000000001', NULL, NOW() - INTERVAL '6 hours'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'deadline_approaching', 'Deadline Approaching', 'Task "Submit Factory Samples" is due in 2 days', '/tasks/23456789-0000-0000-0000-000000000002', 'task', '23456789-0000-0000-0000-000000000002', NULL, NOW() - INTERVAL '8 hours'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'invoice_sent', 'Invoice Sent', 'Invoice #INV-2024-046 sent to client "Marriott International"', '/invoices/34567890-0000-0000-0000-000000000003', 'invoice', '34567890-0000-0000-0000-000000000003', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'prototype_ready', 'Prototype Ready', 'Prototype for "Executive Desk Chair" is ready for review', '/prototypes/45678901-0000-0000-0000-000000000004', 'prototype', '45678901-0000-0000-0000-000000000004', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'factory_review', 'Factory Review Completed', 'Factory review completed for "Guangdong Manufacturing Co."', '/factory-reviews/56789012-0000-0000-0000-000000000005', 'factory_review', '56789012-0000-0000-0000-000000000005', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'packing_list', 'Packing List Generated', 'Packing list generated for Order #PO-2024-003', '/packing/67890123-0000-0000-0000-000000000006', 'packing_list', '67890123-0000-0000-0000-000000000006', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'team_update', 'Team Update', 'Production team completed milestone: Frame Assembly for 50 units', '/production/78901234-0000-0000-0000-000000000007', 'production_order', '78901234-0000-0000-0000-000000000007', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'material_ordered', 'Material Ordered', 'Fabric order placed with supplier "Premium Textiles Ltd"', '/materials/89012345-0000-0000-0000-000000000008', 'material', '89012345-0000-0000-0000-000000000008', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'approval_required', 'Approval Required', 'Your approval is required for Production Budget revision', '/approvals/90123456-0000-0000-0000-000000000009', 'approval', '90123456-0000-0000-0000-000000000009', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
  ('f985b324-7d8d-4e0a-be15-325fd5ea89fd', 'shipment_delay', 'Shipment Delay', 'Shipment for Order #PO-2024-004 delayed by 2 days due to customs', '/shipping/01234567-0000-0000-0000-000000000010', 'order', '01234567-0000-0000-0000-000000000010', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days');

-- Verify inserted notifications
SELECT COUNT(*) as total_notifications,
       COUNT(*) FILTER (WHERE read_at IS NULL) as unread_count,
       COUNT(*) FILTER (WHERE read_at IS NOT NULL) as read_count
FROM public.notifications
WHERE user_id = 'f985b324-7d8d-4e0a-be15-325fd5ea89fd';
