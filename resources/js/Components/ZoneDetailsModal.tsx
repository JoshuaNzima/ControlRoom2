import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { CoverageMeter } from '@/Components/coverage-meter';

interface ZoneDetailsModalProps {
  zone: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ZoneDetailsModal({ zone, isOpen, onClose }: ZoneDetailsModalProps) {
  if (!zone) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{zone.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Coverage Overview */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium">Coverage Status</h4>
                <div className="text-3xl font-bold mt-1">{zone.coverage}%</div>
              </div>
              <Badge
                variant={zone.coverage >= 90 ? 'default' : zone.coverage >= 50 ? 'secondary' : 'destructive'}
                className="text-sm"
              >
                {zone.coverage >= 90 ? 'High' : zone.coverage >= 50 ? 'Medium' : 'Low'} Coverage
              </Badge>
            </div>

            <CoverageMeter
              value={zone.coverage}
              current={zone.guards}
              required={zone.required_guards}
              size="lg"
              label="Guard Coverage"
            />

            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <div className="font-medium">{zone.guards}</div>
                <div className="text-gray-600 dark:text-gray-400">Active Guards</div>
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <div className="font-medium">{zone.required_guards}</div>
                <div className="text-gray-600 dark:text-gray-400">Required</div>
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <div className="font-medium">{zone.sites}</div>
                <div className="text-gray-600 dark:text-gray-400">Total Sites</div>
              </div>
            </div>
          </div>

          {/* Site List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Sites in Zone</h4>
              <div className="text-xs text-gray-500">
                {zone.active_sites || 0} active / {zone.sites} total
              </div>
            </div>
            <div className="max-h-[240px] overflow-y-auto space-y-2">
              {(zone.sites?.length ? zone.sites : zone.site_list)?.map((site: any) => (
                <div 
                  key={site.id} 
                  className="p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between transition-colors duration-200"
                >
                  <div>
                    <div className="font-medium">{site.name}</div>
                    <div className="text-sm text-gray-500 space-x-2">
                      <span>{site.guards} / {site.required_guards} guards</span>
                      {site.alerts > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {site.alerts} Alert{site.alerts !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={site.status === 'active' ? 'default' : 'secondary'}
                    className={site.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : ''}
                  >
                    {site.status}
                  </Badge>
                </div>
              )) || (
                <div className="text-gray-500 text-sm text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  No sites available in this zone
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              View Full Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}