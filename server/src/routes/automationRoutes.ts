import { Router } from 'express';
import { automationManager } from '../index';

const router = Router();

// Get all automations
router.get('/', (req, res) => {
  const automations = automationManager.getAutomations();
  res.json(automations);
});

// Add new automation
router.post('/', async (req, res) => {
  try {
    const newAutomation = await automationManager.addAutomation(req.body);
    res.status(201).json(newAutomation);
  } catch (error) {
    res.status(400).json({ error: 'Invalid automation data' });
  }
});

// Update automation
router.put('/:id', async (req, res) => {
  try {
    const updatedAutomation = await automationManager.updateAutomation({
      ...req.body,
      id: req.params.id
    });
    if (!updatedAutomation) {
      res.status(404).json({ error: 'Automation not found' });
      return;
    }
    res.json(updatedAutomation);
  } catch (error) {
    res.status(400).json({ error: 'Invalid automation data' });
  }
});

// Delete automation
router.delete('/:id', async (req, res) => {
  const success = await automationManager.removeAutomation(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Automation not found' });
    return;
  }
  res.status(204).send();
});

export const automationRoutes = router; 