'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function GroupsPage() {
  const params = useParams();
  const eventId = params.id || "1";

  const [groups, setGroups] = useState<any[]>([]);
  const [newGroupNames, setNewGroupNames] = useState(Array(5).fill(''));

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`groups_event_${eventId}`) || '[]');
    setGroups(saved);
  }, [eventId]);

  const addNewGroup = () => {
    const groupName = prompt("הזן שם לקבוצה החדשה:", `קבוצה ${groups.length + 1}`);
    
    if (groupName && groupName.trim() !== "") {
      const newGroup = {
        id: Date.now(),
        name: groupName.trim(),
        simCount: groups.length + 1
      };
      
      const updated = [...groups, newGroup];
      setGroups(updated);
      localStorage.setItem(`groups_event_${eventId}`, JSON.stringify(updated));
    }
  };

  const addMultipleGroups = () => {
    const validNames = newGroupNames.filter(name => name.trim() !== '');
    
    if (validNames.length === 0) {
      alert("לא הוזנו שמות");
      return;
    }

    const newGroups = validNames.map((name, index) => ({
      id: Date.now() + index,
      name: name.trim(),
      simCount: groups.length + index + 1
    }));

    const updated = [...groups, ...newGroups];
    setGroups(updated);
    localStorage.setItem(`groups_event_${eventId}`, JSON.stringify(updated));
    
    setNewGroupNames(Array(5).fill('')); // ניקוי התיבות
    alert(`✅ ${newGroups.length} קבוצות נוספו בהצלחה!`);
  };

  const deleteGroup = (id: number) => {
    if (confirm('למחוק את הקבוצה?')) {
      const updated = groups.filter(g => g.id !== id);
      setGroups(updated);
      localStorage.setItem(`groups_event_${eventId}`, JSON.stringify(updated));
    }
  };

  const updateGroupName = (id: number) => {
    const currentGroup = groups.find(g => g.id === id);
    if (!currentGroup) return;
    
    const newName = prompt("שנה שם קבוצה:", currentGroup.name);
    if (newName && newName.trim() !== "") {
      const updated = groups.map(g => 
        g.id === id ? { ...g, name: newName.trim() } : g
      );
      setGroups(updated);
      localStorage.setItem(`groups_event_${eventId}`, JSON.stringify(updated));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-[#3f2a1e]">קבוצות מוזמנים</h1>
            <p className="text-gray-600 mt-2">אירוע #{eventId}</p>
          </div>

          <button 
            onClick={addNewGroup}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-3xl font-bold flex items-center gap-3 transition-all active:scale-95 shadow-lg"
          >
            <Plus size={24} /> קבוצה חדשה
          </button>
        </div>

        {/* 5 תיבות להוספת קבוצות מרובות */}
        <div className="bg-white rounded-3xl shadow p-8 mb-10">
          <h3 className="text-xl font-bold mb-6">הוסף קבוצות מרובות</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {newGroupNames.map((name, index) => (
              <input
                key={index}
                type="text"
                value={name}
                onChange={(e) => {
                  const newNames = [...newGroupNames];
                  newNames[index] = e.target.value;
                  setNewGroupNames(newNames);
                }}
                placeholder={`קבוצה ${groups.length + index + 1}`}
                className="p-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
              />
            ))}
          </div>
          <button 
            onClick={addMultipleGroups}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-3xl font-bold w-full md:w-auto"
          >
            העלה את כל הקבוצות
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#3f2a1e] to-[#5c4033] text-white">
              <tr>
                <th className="py-6 px-8 text-right w-24"></th>
                <th className="py-6 px-8 text-right w-24"></th>
                <th className="py-6 px-8 text-right">שם הקבוצה</th>
                <th className="py-6 px-8 text-center">מספר סימול</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-6 px-8">
                    <button 
                      onClick={() => deleteGroup(group.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 px-5 py-3 rounded-2xl transition-all flex items-center gap-2 text-sm font-medium"
                    >
                      <Trash2 size={20} /> מחק
                    </button>
                  </td>

                  <td className="py-6 px-8">
                    <button 
                      onClick={() => updateGroupName(group.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 px-5 py-3 rounded-2xl transition-all flex items-center gap-2 text-sm font-medium"
                    >
                      <Edit3 size={20} /> ערוך
                    </button>
                  </td>

                  <td className="py-6 px-8 font-semibold text-lg">{group.name}</td>
                  <td className="py-6 px-8 text-center font-bold text-xl text-blue-600">{group.simCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}