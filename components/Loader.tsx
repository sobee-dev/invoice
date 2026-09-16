import React from 'react'

const Loader = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b2e5e]"></div>
    </div>
  )
}

export default Loader
