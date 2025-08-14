import { NextRequest, NextResponse } from 'next/server';
import { DownloadManagerImpl } from '@/core/downloads/manager';
import { WorkerPoolImpl } from '@/core/downloads/worker-pool';
import { BandwidthLimiter } from '@/core/downloads/bandwidth-limiter';
import { MultiProfileSecureStorage } from '@/storage/MultiProfileSecureStorage';

// Global instances (in a real app, these would be managed properly)
let downloadManager: DownloadManagerImpl | null = null;

async function getDownloadManager() {
  if (!downloadManager) {
    const storage = new MultiProfileSecureStorage();
    const bandwidthLimiter = new BandwidthLimiter();
    const workerPool = new WorkerPoolImpl(bandwidthLimiter);
    downloadManager = new DownloadManagerImpl(workerPool, storage);
  }
  return downloadManager;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const action = searchParams.get('action');

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const manager = await getDownloadManager();

    switch (action) {
      case 'list':
        const downloads = await manager.list(profileId);
        return NextResponse.json({ downloads });

      case 'progress':
        const downloadId = searchParams.get('downloadId');
        if (!downloadId) {
          return NextResponse.json({ error: 'Download ID is required' }, { status: 400 });
        }
        const progress = await manager.getProgress(profileId, downloadId);
        return NextResponse.json({ progress });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Downloads API GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profileId, action, ...data } = await request.json();

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const manager = await getDownloadManager();

    switch (action) {
      case 'enqueue':
        const { url, options } = data;
        if (!url) {
          return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }
        const task = await manager.enqueue(profileId, url, options);
        return NextResponse.json({ task });

      case 'pause':
        const { downloadId } = data;
        if (!downloadId) {
          return NextResponse.json({ error: 'Download ID is required' }, { status: 400 });
        }
        await manager.pause(profileId, downloadId);
        return NextResponse.json({ success: true });

      case 'resume':
        const { downloadId: resumeId } = data;
        if (!resumeId) {
          return NextResponse.json({ error: 'Download ID is required' }, { status: 400 });
        }
        await manager.resume(profileId, resumeId);
        return NextResponse.json({ success: true });

      case 'cancel':
        const { downloadId: cancelId } = data;
        if (!cancelId) {
          return NextResponse.json({ error: 'Download ID is required' }, { status: 400 });
        }
        await manager.cancel(profileId, cancelId);
        return NextResponse.json({ success: true });

      case 'setPriority':
        const { downloadId: priorityId, priority } = data;
        if (!priorityId || priority === undefined) {
          return NextResponse.json({ error: 'Download ID and priority are required' }, { status: 400 });
        }
        await manager.setPriority(profileId, priorityId, priority);
        return NextResponse.json({ success: true });

      case 'setBandwidthLimit':
        const { limit } = data;
        await manager.setBandwidthLimit(profileId, limit);
        return NextResponse.json({ success: true });

      case 'schedule':
        const { downloadId: scheduleId, when } = data;
        if (!scheduleId || !when) {
          return NextResponse.json({ error: 'Download ID and schedule time are required' }, { status: 400 });
        }
        await manager.schedule(profileId, scheduleId, new Date(when));
        return NextResponse.json({ success: true });

      case 'restore':
        await manager.restore(profileId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Downloads API POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}