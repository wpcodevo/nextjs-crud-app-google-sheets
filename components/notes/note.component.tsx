'use client';

import React, { FC, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import NoteModal from '../note.modal';
import UpdateNote from './update.note';
import { toast } from 'react-toastify';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import NProgress from 'nprogress';
import { deleteSpreadsheetRow } from '@/app/note-api';
import { INote } from '@/app/types';

type NoteItemProps = {
  note: INote;
  notes: INote[];
};

const NoteItem: FC<NoteItemProps> = ({ note, notes }) => {
  const [openSettings, setOpenSettings] = useState(false);
  const [openNoteModal, setOpenNoteModal] = useState(false);

  const removeTodo = async (id: string): Promise<INote[]> => {
    notes.filter((p, index) => {
      if (p.id === id) {
        deleteSpreadsheetRow(index);
        return false;
      } else return true;
    });

    return [];
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = document.getElementById(`settings-dropdown-${note.id}`);

      if (dropdown && !dropdown.contains(target)) {
        setOpenSettings(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [note.id]);

  const queryClient = useQueryClient();
  const { mutate: deleteNote } = useMutation({
    mutationFn: (noteId: string) => removeTodo(noteId),

    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: ['getNotes'] });

      const previousNotes = queryClient.getQueryData<INote[]>(['getNotes']);

      queryClient.setQueryData<INote[]>(['getNotes'], (oldNotes) =>
        oldNotes?.filter((note) => note.id !== noteId)
      );

      return { previousNotes };
    },

    onError: (error: any, _noteId, context) => {
      queryClient.setQueryData(['getNotes'], context?.previousNotes);
      const resMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        error.toString();
      toast(resMessage, {
        type: 'error',
        position: 'top-right',
      });
      NProgress.done();
    },

    onSuccess: () => {
      toast('Note deleted successfully', {
        type: 'warning',
        position: 'top-right',
      });
      NProgress.done();
    },
  });

  const onDeleteHandler = (noteId: string) => {
    if (window.confirm('Are you sure')) {
      deleteNote(noteId);
    }
  };
  return (
    <>
      <div className='p-4 bg-white rounded-lg border border-gray-200 shadow-md flex flex-col justify-between overflow-hidden'>
        <div className='details'>
          <h4 className='mb-2 pb-2 text-2xl font-semibold tracking-tight text-gray-900'>
            {note.title.length > 40
              ? note.title.substring(0, 40) + '...'
              : note.title}
          </h4>
          <p className='mb-3 font-normal text-ct-dark-200'>
            {note.content.length > 210
              ? note.content.substring(0, 210) + '...'
              : note.content}
          </p>
        </div>
        <div className='relative border-t border-slate-300 flex justify-between items-center'>
          <span className='text-ct-dark-100 text-sm'>
            {format(parseISO(note.createdAt.toISOString()), 'PPP')}
          </span>
          <div
            onClick={() => setOpenSettings(!openSettings)}
            className='text-ct-dark-100 text-lg cursor-pointer'
          >
            <i className='bx bx-dots-horizontal-rounded'></i>
          </div>
          <div
            id={`settings-dropdown-${note.id}`}
            className={twMerge(
              `absolute right-0 bottom-3 z-10 w-28 text-base list-none bg-white rounded divide-y divide-gray-100 shadow`,
              `${openSettings ? 'block' : 'hidden'}`
            )}
          >
            <ul className='py-1' aria-labelledby='dropdownButton'>
              <li
                onClick={() => {
                  setOpenSettings(false);
                  setOpenNoteModal(true);
                }}
                className='py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer'
              >
                <i className='bx bx-pencil'></i> Edit
              </li>
              <li
                onClick={() => {
                  setOpenSettings(false);
                  onDeleteHandler(note.id);
                }}
                className='py-2 px-4 text-sm text-red-600 hover:bg-gray-100 cursor-pointer'
              >
                <i className='bx bx-trash'></i> Delete
              </li>
            </ul>
          </div>
        </div>
      </div>
      <NoteModal
        openNoteModal={openNoteModal}
        setOpenNoteModal={setOpenNoteModal}
      >
        <UpdateNote
          note={note}
          notes={notes}
          setOpenNoteModal={setOpenNoteModal}
        />
      </NoteModal>
    </>
  );
};

export default NoteItem;
