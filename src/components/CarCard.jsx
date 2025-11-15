import React from 'react'

export default function CarCard({ car, onSelect }){
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <img src={car.image} alt={car.name} className="w-full h-40 object-cover rounded" />
      <h3 className="font-bold mt-3">{car.name}</h3>
      <p className="text-sm text-gray-600">{car.type}</p>
      <div className="flex items-center justify-between mt-3">
        <div className="text-lg font-semibold">₹{car.total}</div>
        <button onClick={()=>onSelect(car)} className="bg-sky-600 text-white px-3 py-1 rounded">Select</button>
      </div>
    </div>
  )
}
