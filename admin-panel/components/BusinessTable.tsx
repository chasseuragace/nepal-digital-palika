'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Business {
  id: string;
  business_name: string;
  sub_category: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
}

interface BusinessTableProps {
  businesses: Business[];
  loading?: boolean;
  onVerify?: (businessId: string) => Promise<void>;
  onReject?: (businessId: string, reason: string) => Promise<void>;
  canVerify?: boolean;
  verificationErrorMessage?: string;
}

export function BusinessTable({
  businesses,
  loading = false,
  onVerify,
  onReject,
  canVerify = false,
  verificationErrorMessage,
}: BusinessTableProps) {
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Pending
          </Badge>
        );
      case 'suspended':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Suspended
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleVerify = async (businessId: string) => {
    if (!onVerify) return;

    try {
      setVerifyingId(businessId);
      await onVerify(businessId);
      toast.success('Business verified successfully');
    } catch (error) {
      console.error('Error verifying business:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify business');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRejectClick = (businessId: string) => {
    setSelectedBusinessId(businessId);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleRejectSubmit = async () => {
    if (!onReject || !selectedBusinessId) return;

    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }

    try {
      setRejectingId(selectedBusinessId);
      await onReject(selectedBusinessId, rejectionReason);
      toast.success('Business rejected successfully');
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedBusinessId(null);
    } catch (error) {
      console.error('Error rejecting business:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject business');
    } finally {
      setRejectingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
        <span className="text-gray-600">Loading businesses...</span>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No businesses found</h3>
        <p className="text-gray-500">No businesses match your filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {businesses.map((business) => (
          <Card key={business.id} className="border border-green-200/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Business Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800 truncate">{business.business_name}</h3>
                    {getStatusBadge(business.verification_status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                    <span className="text-xs bg-emerald-50 px-2 py-1 rounded">
                      {business.sub_category}
                    </span>
                    <span>Created: {new Date(business.created_at).toLocaleDateString()}</span>
                    {business.verified_at && (
                      <span>Verified: {new Date(business.verified_at).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Rejection Reason */}
                  {business.verification_status === 'rejected' && business.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-700">{business.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 w-24"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>

                  {canVerify && business.verification_status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerify(business.id)}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 w-24"
                        disabled={verifyingId === business.id || rejectingId === business.id}
                      >
                        {verifyingId === business.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verify
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectClick(business.id)}
                        className="border-red-200 text-red-700 hover:bg-red-50 w-24"
                        disabled={verifyingId === business.id || rejectingId === business.id}
                      >
                        {rejectingId === business.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {!canVerify && business.verification_status === 'pending' && (
                    <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded border border-gray-200">
                      {verificationErrorMessage || 'Verification not available'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Business</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this business. The business owner will see this reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-gray-700 font-medium">
                Rejection Reason *
              </Label>
              <Textarea
                id="reason"
                placeholder="Explain why this business is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-24 border-green-200 focus:border-emerald-400 focus:ring-emerald-400/20"
              />
              <p className="text-xs text-gray-500">
                Be specific and constructive. This will help the business owner improve.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectSubmit}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={!rejectionReason.trim()}
            >
              Reject Business
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
