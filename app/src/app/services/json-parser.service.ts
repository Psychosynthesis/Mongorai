import type { NotificationType } from '../NotificationsContext';

type SpecialObject = {
  $type: string;
  $value: any;
};

export class JsonParser {
  static parse(input: string, notify: (msg: string, type: NotificationType) => void): any {
    if (input.trim() === '') {
      notify('Empty input', 'warning'); // Отдельное уведомление
      return null; // Или undefined, или другое значение по умолчанию
    }

    try {
      return JSON.parse(input, this.reviver);
    } catch (error) {
      notify(`Invalid JSON: ${input}`, 'error');
      return {};
    }
  }

  private static reviver(key: string, value: any): any {
    if (value && typeof value === 'object' && '$type' in value) {
      switch (value.$type) {
        case 'RegExp':
          return new RegExp(value.$value.$pattern, value.$value.$flags);
        case 'Date':
          return new Date(value.$value);
        case 'ObjectId':
          return { $oid: value.$value }; // Для совместимости с MongoDB
        default:
          return value;
      }
    }
    return value;
  }

  static stringify(value: any): string {
    return JSON.stringify(value, this.replacer, 2);
  }

  private static replacer(key: string, value: any): any {
    if (value instanceof RegExp) {
      return {
        $type: 'RegExp',
        $value: {
          $pattern: value.source,
          $flags: value.flags
        }
      };
    }
    if (value instanceof Date) {
      return {
        $type: 'Date',
        $value: value.toISOString()
      };
    }
    return value;
  }
}
