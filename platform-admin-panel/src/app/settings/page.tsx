'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">Configure system settings and preferences</p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">General Settings</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Platform Name
              </label>
              <input
                type="text"
                defaultValue="Nepal Digital Tourism Infrastructure"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Support Email
              </label>
              <input
                type="email"
                defaultValue="support@nepaltourism.dev"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Support Phone
              </label>
              <input
                type="tel"
                defaultValue="+977-1-4123456"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">Security Settings</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                defaultValue="30"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password Min Length
              </label>
              <input
                type="number"
                defaultValue="8"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="2fa"
                defaultChecked
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="2fa" className="text-sm font-medium text-slate-700">
                Require 2FA for Admins
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">Notification Settings</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="email-admin"
                defaultChecked
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="email-admin" className="text-sm font-medium text-slate-700">
                Email on Admin Creation
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="email-permission"
                defaultChecked
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="email-permission" className="text-sm font-medium text-slate-700">
                Email on Permission Change
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="email-suspicious"
                defaultChecked
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="email-suspicious" className="text-sm font-medium text-slate-700">
                Email on Suspicious Activity
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button variant="primary">Save Changes</Button>
          <Button variant="secondary">Cancel</Button>
        </div>
      </div>
    </AdminLayout>
  )
}
