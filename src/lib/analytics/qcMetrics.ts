/**
 * QC Metrics and Analytics Tracking
 * Phase 8: KPI Instrumentation
 */

export interface InspectionMetrics {
  inspection_id: string;
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
  total_checkpoints: number;
  passed_checkpoints: number;
  failed_checkpoints: number;
  na_checkpoints: number;
  photos_captured: number;
  voice_notes_used: number;
  inspector_id?: string;
  factory_id?: string;
}

export interface CheckpointMetrics {
  checkpoint_code: string;
  checkpoint_text: string;
  pass_count: number;
  fail_count: number;
  na_count: number;
  total_count: number;
  pass_rate: number;
  fail_rate: number;
  common_failures: Array<{
    note: string;
    count: number;
  }>;
}

export interface FactoryMetrics {
  factory_id: string;
  factory_name: string;
  total_inspections: number;
  passed_inspections: number;
  failed_inspections: number;
  pass_rate: number;
  avg_inspection_duration_minutes: number;
  common_issues: Array<{
    checkpoint_text: string;
    failure_count: number;
  }>;
}

export interface InspectorMetrics {
  inspector_id: string;
  inspector_name: string;
  total_inspections: number;
  completed_inspections: number;
  avg_inspection_duration_minutes: number;
  thoroughness_score: number; // Based on notes/photos usage
  photos_per_inspection: number;
  voice_notes_per_inspection: number;
}

/**
 * Track inspection start event
 */
export function trackInspectionStart(data: {
  inspection_id: string;
  inspection_type: 'qc' | 'factory_review';
  item_id?: string;
  prototype_id?: string;
  inspector_id?: string;
}) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'inspection_start', {
      event_category: 'qc_inspection',
      event_label: data.inspection_type,
      inspection_id: data.inspection_id,
    });
  }
}

/**
 * Track inspection completion event
 */
export function trackInspectionComplete(data: {
  inspection_id: string;
  inspection_type: 'qc' | 'factory_review';
  final_status: 'passed' | 'failed';
  duration_seconds: number;
  total_checkpoints: number;
  passed_checkpoints: number;
  failed_checkpoints: number;
  photos_captured: number;
  voice_notes_used: number;
}) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'inspection_complete', {
      event_category: 'qc_inspection',
      event_label: data.final_status,
      value: data.duration_seconds,
      inspection_id: data.inspection_id,
      total_checkpoints: data.total_checkpoints,
      passed_checkpoints: data.passed_checkpoints,
      failed_checkpoints: data.failed_checkpoints,
      photos_captured: data.photos_captured,
      voice_notes_used: data.voice_notes_used,
    });
  }
}

/**
 * Track checkpoint result
 */
export function trackCheckpointResult(data: {
  inspection_id: string;
  checkpoint_id: string;
  checkpoint_code: string;
  status: 'pass' | 'fail' | 'na';
  severity?: 'minor' | 'major' | 'critical';
  has_photo: boolean;
  has_note: boolean;
  has_voice_note: boolean;
}) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'checkpoint_result', {
      event_category: 'qc_checkpoint',
      event_label: data.status,
      checkpoint_code: data.checkpoint_code,
      severity: data.severity,
      has_photo: data.has_photo,
      has_note: data.has_note,
      has_voice_note: data.has_voice_note,
    });
  }
}

/**
 * Track photo capture
 */
export function trackPhotoCapture(data: {
  inspection_id: string;
  checkpoint_id: string;
  photo_count: number;
}) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'photo_capture', {
      event_category: 'qc_media',
      event_label: 'photo',
      value: data.photo_count,
      inspection_id: data.inspection_id,
    });
  }
}

/**
 * Track voice note usage
 */
export function trackVoiceNote(data: {
  inspection_id: string;
  checkpoint_id: string;
  transcript_length: number;
}) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'voice_note', {
      event_category: 'qc_media',
      event_label: 'voice',
      value: data.transcript_length,
      inspection_id: data.inspection_id,
    });
  }
}

/**
 * Track batch pass action
 */
export function trackBatchPass(data: {
  inspection_id: string;
  section_id: string;
  checkpoint_count: number;
}) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'batch_pass', {
      event_category: 'qc_efficiency',
      event_label: 'batch_action',
      value: data.checkpoint_count,
      inspection_id: data.inspection_id,
    });
  }
}

/**
 * Track offline mode usage
 */
export function trackOfflineMode(data: {
  event: 'enter_offline' | 'exit_offline' | 'offline_sync';
  pending_count?: number;
}) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', data.event, {
      event_category: 'offline_mode',
      event_label: data.event,
      value: data.pending_count || 0,
    });
  }
}
