'use client';

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import NProgress from 'nprogress';
import { getSpreasheetData } from './note-api';
import NoteItem from '@/components/notes/note.component';
import NoteModal from '@/components/note.modal';
import CreateNote from '@/components/notes/create.note';

function AppContent() {
  const [openNoteModal, setOpenNoteModal] = useState(false);

  const loadTodos = async () => {
    const response = await getSpreasheetData();
    console.log(response);
    const notes = response?.values?.map((t: string[]) => ({
      id: t[0],
      title: t[1],
      content: t[2],
      createdAt: new Date(t[3]),
      updatedAt: new Date(t[4]),
    }));
    return notes || [];
  };

  const {
    data: notes,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    error,
  } = useQuery({
    queryKey: ['getNotes'],
    queryFn: () => loadTodos(),
    staleTime: 5 * 1000,
    select: (data) => data,
  });

  useEffect(() => {
    if (isLoading || isFetching) {
      NProgress.start();
    }
    if (isSuccess) {
      NProgress.done();
    }

    if (isError) {
      toast(error.message, {
        type: 'error',
        position: 'top-right',
      });
      NProgress.done();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isFetching]);

  return (
    <div className='2xl:max-w-[90rem] max-w-[68rem] mx-auto'>
      <div className='m-8 grid grid-cols-[repeat(auto-fill,_320px)] gap-7 grid-rows-[1fr]'>
        <div className='p-4 min-h-[18rem] bg-white rounded-lg border border-gray-200 shadow-md flex flex-col items-center justify-center'>
          <div
            onClick={() => setOpenNoteModal(true)}
            className='flex items-center justify-center h-20 w-20 border-2 border-dashed border-ct-blue-600 rounded-full text-ct-blue-600 text-5xl cursor-pointer'
          >
            <i className='bx bx-plus'></i>
          </div>
          <h4
            onClick={() => setOpenNoteModal(true)}
            className='text-lg font-medium text-ct-blue-600 mt-5 cursor-pointer'
          >
            Add new note
          </h4>
        </div>
        {/* Note Items */}

        {notes?.map((note) => (
          <NoteItem key={note.id} note={note} notes={notes} />
        ))}

        {/* Create Note Modal */}
        <NoteModal
          openNoteModal={openNoteModal}
          setOpenNoteModal={setOpenNoteModal}
        >
          <CreateNote setOpenNoteModal={setOpenNoteModal} />
        </NoteModal>
      </div>
    </div>
  );
}

function Home() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <ToastContainer />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </>
  );
}

export default Home;
