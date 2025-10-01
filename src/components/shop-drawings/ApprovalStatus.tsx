"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Palette
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type ApprovalStatusType = "pending" | "approved" | "rejected" | "changes_requested"

export interface ApprovalInfo {
  status: ApprovalStatusType
  approvedBy?: {
    id: string
    name: string
  } | null
  approvedAt?: Date | null
  notes?: string | null
}

export interface Drawing {
  id: string
  limnApproval: ApprovalInfo
  designerApproval: ApprovalInfo
}

export interface ApprovalStatusProps {
  drawing: Drawing
}

const approvalStatusConfig: Record<ApprovalStatusType, {
  label: string
  icon: React.ElementType
  className: string
  bgClassName: string
}> = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    className: "text-yellow-800 border-yellow-300",
    bgClassName: "bg-yellow-50"
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "text-green-800 border-green-300",
    bgClassName: "bg-green-50"
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "text-red-800 border-red-300",
    bgClassName: "bg-red-50"
  },
  changes_requested: {
    label: "Changes Requested",
    icon: AlertTriangle,
    className: "text-orange-800 border-orange-300",
    bgClassName: "bg-orange-50"
  }
}

function ApprovalCard({
  title,
  icon: Icon,
  approval,
  iconColor
}: {
  title: string
  icon: React.ElementType
  approval: ApprovalInfo
  iconColor: string
}) {
  const config = approvalStatusConfig[approval.status]
  const StatusIcon = config.icon

  return (
    <Card className={cn("transition-all", config.bgClassName)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon
            className={cn("w-5 h-5", iconColor)}
            aria-hidden="true"
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge
          variant="outline"
          className={cn("text-xs font-semibold", config.className, config.bgClassName)}
        >
          <StatusIcon className="w-3 h-3 mr-1" aria-hidden="true" />
          {config.label}
        </Badge>

        {approval.approvedBy && approval.approvedAt && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              <span className="font-medium">By:</span> {approval.approvedBy.name}
            </div>
            <div>
              <span className="font-medium">When:</span>{" "}
              <time dateTime={approval.approvedAt.toISOString()}>
                {formatDistanceToNow(approval.approvedAt, { addSuffix: true })}
              </time>
            </div>
          </div>
        )}

        {approval.notes && (
          <div className="text-xs bg-white/60 p-2 rounded border border-border">
            <p className="font-medium mb-1">Notes:</p>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {approval.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ApprovalStatus({ drawing }: ApprovalStatusProps) {
  const bothApproved =
    drawing.limnApproval.status === "approved" &&
    drawing.designerApproval.status === "approved"

  const anyRejected =
    drawing.limnApproval.status === "rejected" ||
    drawing.designerApproval.status === "rejected"

  return (
    <div className="space-y-4">
      {/* Overall status banner */}
      <Card className={cn(
        "border-2",
        bothApproved && "border-green-500 bg-green-50",
        anyRejected && "border-red-500 bg-red-50",
        !bothApproved && !anyRejected && "border-yellow-500 bg-yellow-50"
      )}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            {bothApproved && (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-green-900">Fully Approved</p>
                  <p className="text-xs text-green-700">
                    Both Limn team and Designer have approved this drawing
                  </p>
                </div>
              </>
            )}
            {anyRejected && (
              <>
                <XCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-red-900">Approval Required</p>
                  <p className="text-xs text-red-700">
                    One or more parties have rejected or requested changes
                  </p>
                </div>
              </>
            )}
            {!bothApproved && !anyRejected && (
              <>
                <Clock className="w-6 h-6 text-yellow-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-yellow-900">Pending Approval</p>
                  <p className="text-xs text-yellow-700">
                    Awaiting approval from one or more parties
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual approval cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ApprovalCard
          title="Limn Team"
          icon={Building2}
          approval={drawing.limnApproval}
          iconColor="text-blue-600"
        />
        <ApprovalCard
          title="Designer"
          icon={Palette}
          approval={drawing.designerApproval}
          iconColor="text-purple-600"
        />
      </div>
    </div>
  )
}
