import React, { useState } from 'react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import { useToast } from '@/Components/ui/use-toast';

type QrType = 'zone' | 'checkpoint' | 'asset' | 'location';

declare global {
  interface Window {
    appName?: string;
  }
}

const QRCodeGenerator: React.FC = () => {
  const [qrData, setQrData] = useState<string>('');
  const [qrType, setQrType] = useState<QrType>('zone');
  const [qrSize, setQrSize] = useState<number>(256);
  const { toast } = useToast();

  const generateQRValue = (): string => {
    const qrContent = {
      type: qrType,
      data: qrData,
      timestamp: new Date().toISOString(),
      controlRoom: window.appName || 'ControlRoom',
    };
    return JSON.stringify(qrContent);
  };

  const downloadQR = (): void => {
    if (!qrData) {
      toast({
        title: 'Missing Data',
        description: 'Please enter the required information first.',
        variant: 'destructive',
      });
      return;
    }

    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');

    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${qrType}-qrcode-${new Date().getTime()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    toast({
      title: 'QR Code Downloaded',
      description: 'The QR code has been saved to your device.',
    });
  };

  const getPlaceholder = (): string => {
    switch (qrType) {
      case 'zone':
        return 'Enter zone identifier or name';
      case 'checkpoint':
        return 'Enter checkpoint location or ID';
      case 'asset':
        return 'Enter asset tag or identifier';
      case 'location':
        return 'Enter location details';
      default:
        return 'Enter data for QR code';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">QR Code Generator</h2>
          <p className="text-sm text-gray-500 mb-4">
            Generate QR codes for zones, checkpoints, and assets that can be scanned by supervisors and guards.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>QR Code Type</Label>
            <RadioGroup value={qrType} onValueChange={(v) => setQrType(v as QrType)} className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zone" id="zone" />
                <Label htmlFor="zone">Zone</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="checkpoint" id="checkpoint" />
                <Label htmlFor="checkpoint">Checkpoint</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="asset" id="asset" />
                <Label htmlFor="asset">Asset</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="location" id="location" />
                <Label htmlFor="location">Location</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Data</Label>
            <Input
              type="text"
              placeholder={getPlaceholder()}
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>QR Code Size</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="range"
                min={128}
                max={512}
                step={32}
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-500 w-16">{qrSize}px</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCode id="qr-code-canvas" value={generateQRValue()} size={qrSize} level="H" includeMargin className="mx-auto" />
          </div>

          <Button onClick={downloadQR} disabled={!qrData} className="w-full sm:w-auto">
            Download QR Code
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default QRCodeGenerator;


