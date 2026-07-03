import { AlbumPage } from '@/components/album/AlbumPage';

export const metadata = { title: 'Álbum | World Legends' };

export default function AlbumRoute() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 pb-28 max-w-2xl mx-auto w-full">
        <AlbumPage />
      </div>
    </div>
  );
}
