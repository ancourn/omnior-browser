import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { omniorStore } from '@/lib/store/omnior-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'list':
        const extensions = await db.extension.findMany({
          orderBy: { installedAt: 'desc' },
        });
        return NextResponse.json(extensions);

      case 'get':
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json({ error: 'Extension ID required' }, { status: 400 });
        }
        
        const extension = await db.extension.findUnique({
          where: { id },
          include: {
            storage: true,
            settings: true,
          },
        });
        
        if (!extension) {
          return NextResponse.json({ error: 'Extension not found' }, { status: 404 });
        }
        
        return NextResponse.json(extension);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Extension GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'install':
        const { manifest, extensionId } = data;
        
        if (!manifest || !extensionId) {
          return NextResponse.json({ error: 'Manifest and extension ID required' }, { status: 400 });
        }

        // Install extension using Omnior Store
        await omniorStore.installExtension(manifest, extensionId);

        // Save to database
        const newExtension = await db.extension.create({
          data: {
            id: extensionId,
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            author: manifest.author,
            homepage: manifest.homepage,
            icons: JSON.stringify(manifest.icons || {}),
            permissions: JSON.stringify(manifest.permissions || []),
            enabled: true,
          },
        });

        return NextResponse.json(newExtension);

      case 'uninstall':
        const { id: uninstallId } = data;
        
        if (!uninstallId) {
          return NextResponse.json({ error: 'Extension ID required' }, { status: 400 });
        }

        // Uninstall extension using Omnior Store
        await omniorStore.uninstallExtension(uninstallId);

        // Remove from database
        await db.extension.delete({
          where: { id: uninstallId },
        });

        return NextResponse.json({ success: true });

      case 'toggle':
        const { id: toggleId, enabled } = data;
        
        if (!toggleId || typeof enabled !== 'boolean') {
          return NextResponse.json({ error: 'Extension ID and enabled state required' }, { status: 400 });
        }

        const updatedExtension = await db.extension.update({
          where: { id: toggleId },
          data: { enabled },
        });

        // Activate or deactivate extension using Omnior Store
        if (enabled) {
          await omniorStore.activateExtension(toggleId);
        } else {
          await omniorStore.deactivateExtension(toggleId);
        }

        return NextResponse.json(updatedExtension);

      case 'storage':
        const { id: storageId, area, key, value, operation } = data;
        
        if (!storageId || !area || !key || !operation) {
          return NextResponse.json({ error: 'Extension ID, area, key, and operation required' }, { status: 400 });
        }

        switch (operation) {
          case 'get':
            const storageItem = await db.extensionStorage.findUnique({
              where: {
                extensionId_area_key: {
                  extensionId: storageId,
                  area,
                  key,
                },
              },
            });
            
            return NextResponse.json(storageItem ? JSON.parse(storageItem.value) : null);

          case 'set':
            if (value === undefined) {
              return NextResponse.json({ error: 'Value required for set operation' }, { status: 400 });
            }

            await db.extensionStorage.upsert({
              where: {
                extensionId_area_key: {
                  extensionId: storageId,
                  area,
                  key,
                },
              },
              update: { value: JSON.stringify(value) },
              create: {
                extensionId: storageId,
                area,
                key,
                value: JSON.stringify(value),
              },
            });

            return NextResponse.json({ success: true });

          case 'remove':
            await db.extensionStorage.deleteMany({
              where: {
                extensionId: storageId,
                area,
                key,
              },
            });

            return NextResponse.json({ success: true });

          case 'clear':
            await db.extensionStorage.deleteMany({
              where: {
                extensionId: storageId,
                area,
              },
            });

            return NextResponse.json({ success: true });

          default:
            return NextResponse.json({ error: 'Invalid storage operation' }, { status: 400 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Extension POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}