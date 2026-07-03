import { describe, expect, it } from 'vitest';
import {
  createCollectorPublisher,
  createDomainEvent,
  noopPublisher,
} from '../../src/domain-event/domain-event';

describe('DomainEvent', () => {
  describe('noopPublisher', () => {
    it('não lança exceção ao ser chamado', () => {
      const event = createDomainEvent('test', {});
      expect(() => noopPublisher(event)).not.toThrow();
    });
  });

  describe('createDomainEvent', () => {
    it('cria um evento com os campos corretos', () => {
      const before = new Date();
      const event = createDomainEvent('test_event', { value: 42 });
      const after = new Date();

      expect(event.eventType).toBe('test_event');
      expect(event.payload).toEqual({ value: 42 });
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('o evento é imutável (frozen)', () => {
      const event = createDomainEvent('test', { x: 1 });
      expect(Object.isFrozen(event)).toBe(true);
    });

    it('o payload é imutável (frozen)', () => {
      const event = createDomainEvent('test', { x: 1 });
      expect(Object.isFrozen(event.payload)).toBe(true);
    });
  });

  describe('createCollectorPublisher', () => {
    it('coleta eventos publicados', () => {
      const { publisher, events } = createCollectorPublisher();
      const event1 = createDomainEvent('evt_a', { n: 1 });
      const event2 = createDomainEvent('evt_b', { n: 2 });

      publisher(event1);
      publisher(event2);

      expect(events).toHaveLength(2);
      expect(events[0]).toBe(event1);
      expect(events[1]).toBe(event2);
    });

    it('inicia com array vazio', () => {
      const { events } = createCollectorPublisher();
      expect(events).toHaveLength(0);
    });
  });
});
