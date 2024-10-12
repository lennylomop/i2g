import React, { useState } from 'react'
import { PlusCircle, Circle, CheckCircle, X } from 'lucide-react'

type Priority = 'A' | 'B' | 'C' | 'D'

interface Task {
  id: number
  title: string
  info: string
  priority: Priority | null
  completed: boolean
}

const priorityColors: Record<Priority, string> = {
  A: 'bg-red-500',
  B: 'bg-orange-500',
  C: 'bg-yellow-500',
  D: 'bg-green-500',
}

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [info, setInfo] = useState('')
  const [priority, setPriority] = useState<Priority | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      setTasks([
        ...tasks,
        { id: Date.now(), title, info, priority, completed: false },
      ])
      setTitle('')
      setInfo('')
      setPriority(null)
    }
  }

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const activeTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)

  const sortedActiveTasks = activeTasks.sort((a, b) => {
    const priorityOrder = { A: 0, B: 1, C: 2, D: 3, null: 4 }
    return (priorityOrder[a.priority || 'null'] || 0) - (priorityOrder[b.priority || 'null'] || 0)
  })

  const closeModal = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedTask(null)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-6">To-Do Liste</h1>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel der Aufgabe"
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <textarea
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            placeholder="Zusätzliche Informationen"
            className="w-full p-2 mb-4 border rounded h-24"
          />
          <div className="flex items-center mb-4">
            <span className="mr-2">Priorität:</span>
            {(['A', 'B', 'C', 'D'] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`mr-2 px-3 py-1 rounded ${
                  priority === p ? priorityColors[p] : 'bg-gray-200'
                } text-white`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            <PlusCircle className="inline-block mr-2" />
            Aufgabe erstellen
          </button>
        </form>
      </div>
      <div className="flex-1 p-8 overflow-auto">
        <h2 className="text-2xl font-bold mb-4">Aktive Aufgaben</h2>
        <ul>
          {sortedActiveTasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-center mb-2 p-3 rounded-lg ${
                task.priority ? priorityColors[task.priority] : 'bg-gray-200'
              } text-white`}
            >
              <button onClick={() => toggleTask(task.id)} className="mr-2">
                <Circle className="text-white" />
              </button>
              <span className="flex-grow cursor-pointer" onClick={() => setSelectedTask(task)}>
                {task.title}
              </span>
              {task.priority && (
                <span className="ml-2 px-2 py-1 bg-white text-gray-800 rounded">
                  {task.priority}
                </span>
              )}
            </li>
          ))}
        </ul>
        {completedTasks.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mt-8 mb-4">Erledigte Aufgaben</h2>
            <ul>
              {completedTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center mb-2 p-3 rounded-lg bg-gray-300 text-gray-600"
                >
                  <button onClick={() => toggleTask(task.id)} className="mr-2">
                    <CheckCircle className="text-gray-600" />
                  </button>
                  <span className="flex-grow cursor-pointer line-through" onClick={() => setSelectedTask(task)}>
                    {task.title}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={closeModal}>
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedTask.title}</h3>
              <button onClick={() => setSelectedTask(null)} className="text-gray-500 hover:text-gray-700">
                <X />
              </button>
            </div>
            <p className="text-gray-600 mb-4">{selectedTask.info}</p>
            <div className="flex items-center">
              <span className="mr-2">Priorität:</span>
              {selectedTask.priority && (
                <span className={`px-2 py-1 rounded text-white ${priorityColors[selectedTask.priority]}`}>
                  {selectedTask.priority}
                </span>
              )}
            </div>
            <div className="mt-4">
              <span className="font-semibold">Status:</span>
              <span className={selectedTask.completed ? "text-green-500 ml-2" : "text-yellow-500 ml-2"}>
                {selectedTask.completed ? "Erledigt" : "Aktiv"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}