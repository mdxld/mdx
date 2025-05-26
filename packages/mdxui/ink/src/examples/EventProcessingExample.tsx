import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
import { EventStatus } from '../components/EventStatus';
import { EventProgressIndicator } from '../components/EventProgressIndicator';
import { EventStatusProvider, useEventStatus } from '../components/EventStatusProvider';

const mockEventRegistry = {
  handlers: new Map(),
  on(event: string, callback: (data: any) => any) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push({ event, callback });
    return this;
  },
  async emit(event: string, data?: any) {
    console.log(`Emitting event: ${event}`);
    const handlers = this.handlers.get(event) || [];
    const results = [];
    
    for (const handler of handlers) {
      try {
        const result = await handler.callback(data);
        results.push(result);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }
    
    return { results };
  }
};

export const EventProcessingExample: React.FC = () => {
  return (
    <EventStatusProvider>
      <EventProcessor />
    </EventStatusProvider>
  );
};

const EventProcessor: React.FC = () => {
  const { addEvent, updateEvent, completeEvent, events } = useEventStatus();
  
  useEffect(() => {
    const runWorkflow = async () => {
      addEvent({
        id: 'idea.captured',
        name: 'Idea Captured',
        status: 'running'
      });
      
      for (let marketIndex = 0; marketIndex < 3; marketIndex++) {
        const marketId = `idea.captured.market-${marketIndex}`;
        
        addEvent({
          id: marketId,
          name: `Market Segment ${marketIndex + 1}`,
          status: 'running'
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        for (let icpIndex = 0; icpIndex < 2; icpIndex++) {
          const icpId = `${marketId}.icp-${icpIndex}`;
          
          addEvent({
            id: icpId,
            name: `ICP ${icpIndex + 1} for Market ${marketIndex + 1}`,
            status: 'running'
          });
          
          const leanCanvasId = `${icpId}.lean-canvas`;
          addEvent({
            id: leanCanvasId,
            name: 'Generate Lean Canvas',
            status: 'running'
          });
          
          await new Promise(resolve => setTimeout(resolve, 800));
          completeEvent(leanCanvasId);
          
          const storyBrandId = `${icpId}.story-brand`;
          addEvent({
            id: storyBrandId,
            name: 'Generate Story Brand',
            status: 'running'
          });
          
          await new Promise(resolve => setTimeout(resolve, 600));
          
          if (Math.random() > 0.8) {
            completeEvent(storyBrandId, 'Failed to generate story brand');
          } else {
            completeEvent(storyBrandId);
          }
          
          completeEvent(icpId);
        }
        
        completeEvent(marketId);
      }
      
      completeEvent('idea.captured');
    };
    
    runWorkflow();
  }, []);
  
  const totalEvents = events.reduce((count, event) => {
    const childCount = event.children ? event.children.length : 0;
    return count + 1 + childCount;
  }, 0);
  
  const completedEvents = events.reduce((count, event) => {
    const isCompleted = event.status === 'completed' || event.status === 'failed';
    const completedChildren = event.children 
      ? event.children.filter(child => 
          child.status === 'completed' || child.status === 'failed'
        ).length 
      : 0;
    
    return count + (isCompleted ? 1 : 0) + completedChildren;
  }, 0);
  
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Startup Idea Processing</Text>
      
      <EventProgressIndicator 
        current={completedEvents} 
        total={totalEvents} 
      />
      
      <EventStatus 
        events={events} 
        title="Event Processing Status" 
      />
    </Box>
  );
};
