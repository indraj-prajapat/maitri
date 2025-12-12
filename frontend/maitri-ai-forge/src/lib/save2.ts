import { SavedMapping } from '@/components/PastMappings';
const API_BASE_URL2 = 'http://localhost:5000/save2';

const save2 = async (mapping: SavedMapping): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL2}/mappings2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mapping),
    });

    if (!response.ok) {
      throw new Error('Failed to save mapping2');
    }
  } catch (error) {
    console.error('Failed to save mapping2:', error);
    throw error;
  }
};



const update2 = async (
  id: string,
  updatedMapping: SavedMapping
): Promise<void> => {
  console.log('Updating mapping with ID:', id, 'Updated Data:', updatedMapping);
  try {
    const response = await fetch(`${API_BASE_URL2}/update2/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedMapping),
    });

    if (!response.ok) {
      throw new Error('Failed to update mapping');
    }
  } catch (error) {
    console.error('Failed to update mapping:', error);
    throw error;
  }
};

const delete2 = async (id: string): Promise<void> => {
  // Show confirmation dialog
  // const confirmed = window.confirm('Are you sure you want to delete this mapping? This action cannot be undone.');
  
  // if (!confirmed) {
  //   return; // User cancelled
  // }
  
  try {
    const response = await fetch(`${API_BASE_URL2}/mappings/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete mapping');
    }
  } catch (error) {
    console.error('Failed to delete mapping:', error);
    throw error;
  }
};



export { save2, update2, delete2 };
