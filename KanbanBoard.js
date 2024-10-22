import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, ChevronDown, Circle, CheckCircle2, XCircle, AlertCircle, Clock, ArrowUpCircle } from 'lucide-react';

const KanbanBoard = () => {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [grouping, setGrouping] = useState(localStorage.getItem('grouping') || 'status');
  const [sorting, setSorting] = useState(localStorage.getItem('sorting') || 'priority');
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('grouping', grouping);
    localStorage.setItem('sorting', sorting);
  }, [grouping, sorting]);

  const fetchData = async () => {
    try {
      const response = await fetch('https://api.quicksell.co/v1/internal/frontend-assignment');
      const data = await response.json();
      if (data && Array.isArray(data.tickets) && Array.isArray(data.users)) {
        setTickets(data.tickets);
        setUsers(data.users);
      } else {
        console.error('Invalid data format received');
        setTickets([]);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTickets([]);
      setUsers([]);
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      4: 'Urgent',
      3: 'High',
      2: 'Medium',
      1: 'Low',
      0: 'No priority'
    };
    return labels[priority] || 'No priority';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      4: <AlertCircle className="text-red-500" size={16} />,
      3: <AlertCircle className="text-orange-500" size={16} />,
      2: <AlertCircle className="text-yellow-500" size={16} />,
      1: <AlertCircle className="text-blue-500" size={16} />,
      0: <AlertCircle className="text-gray-500" size={16} />
    };
    return icons[priority] || icons[0];
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Backlog': <Clock className="text-gray-500" size={16} />,
      'Todo': <Circle className="text-gray-500" size={16} />,
      'In Progress': <ArrowUpCircle className="text-yellow-500" size={16} />,
      'Done': <CheckCircle2 className="text-green-500" size={16} />,
      'Canceled': <XCircle className="text-red-500" size={16} />
    };
    return icons[status] || <Circle className="text-gray-500" size={16} />;
  };

  const sortTickets = (ticketsToSort) => {
    return [...ticketsToSort].sort((a, b) => {
      if (sorting === 'priority') {
        return b.priority - a.priority;
      }
      return a.title.localeCompare(b.title);
    });
  };

  const groupTickets = () => {
    let grouped = {};
    
    if (grouping === 'status') {
      grouped = {
        'Backlog': [],
        'Todo': [],
        'In Progress': [],
        'Done': [],
        'Canceled': []
      };
      tickets.forEach(ticket => {
        if (grouped[ticket.status]) {
          grouped[ticket.status].push(ticket);
        }
      });
    } else if (grouping === 'user') {
      // Initialize groups first
      users.forEach(user => {
        grouped[user.name] = [];
      });
      tickets.forEach(ticket => {
        const user = users.find(u => u.id === ticket.userId);
        if (user && grouped[user.name]) {
          grouped[user.name].push(ticket);
        }
      });
    } else if (grouping === 'priority') {
      grouped = {
        'Urgent': [],
        'High': [],
        'Medium': [],
        'Low': [],
        'No priority': []
      };
      tickets.forEach(ticket => {
        const priorityLabel = getPriorityLabel(ticket.priority);
        if (grouped[priorityLabel]) {
          grouped[priorityLabel].push(ticket);
        }
      });
    }

    // Sort tickets in each group
    Object.keys(grouped).forEach(key => {
      grouped[key] = sortTickets(grouped[key]);
    });

    return grouped;
  };

  const groupedTickets = groupTickets();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="relative mb-6">
        <button
          onClick={() => setShowDisplayMenu(!showDisplayMenu)}
          className="flex items-center gap-2 bg-white rounded-md px-4 py-2 shadow-sm"
        >
          <MoreHorizontal size={16} />
          <span>Display</span>
          <ChevronDown size={16} />
        </button>

        {showDisplayMenu && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-md shadow-lg p-4 w-64">
            <div className="mb-4">
              <label className="text-sm text-gray-600">Grouping</label>
              <select
                value={grouping}
                onChange={(e) => setGrouping(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="status">Status</option>
                <option value="user">User</option>
                <option value="priority">Priority</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Ordering</label>
              <select
                value={sorting}
                onChange={(e) => setSorting(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Object.entries(groupedTickets).map(([group, groupTickets]) => (
          <div key={group} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {grouping === 'status' && getStatusIcon(group)}
                {grouping === 'priority' && getPriorityIcon(
                  Object.entries(getPriorityLabel)
                    .find(([key, value]) => value === group)?.[0] || 0
                )}
                {grouping === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                )}
                <span className="font-medium">{group}</span>
                <span className="text-gray-500">{groupTickets.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-gray-500" />
                <MoreHorizontal size={16} className="text-gray-500" />
              </div>
            </div>

            <div className="space-y-3">
              {groupTickets.map(ticket => (
                <div key={ticket.id} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500">{ticket.id}</span>
                    <div className="w-6 h-6 rounded-full bg-gray-300" />
                  </div>
                  <h3 className="font-medium mb-2">{ticket.title}</h3>
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(ticket.priority)}
                    <span className="text-gray-500 text-sm">
                      {ticket.tag?.join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;