import type { Moment } from 'moment';
import type { Task } from '../../Task';
import { DateParser } from '../DateParser';
import { Field } from './Field';
import { FilterOrErrorMessage } from './Filter';

/**
 * Support the 'happens' search instruction, which searches all of
 * start, scheduled and due dates.
 */
export class HappensDateField extends Field {
    private static readonly happensRegexp = /^happens (before|after|on)? ?(.*)/;
    private static readonly instructionForFieldPresence = 'has happens date';
    private static readonly instructionForFieldAbsence = 'no happens date';

    public canCreateFilterForLine(line: string): boolean {
        if (line === HappensDateField.instructionForFieldPresence) {
            return true;
        }
        if (line === HappensDateField.instructionForFieldAbsence) {
            return true;
        }
        return super.canCreateFilterForLine(line);
    }

    public createFilterOrErrorMessage(line: string): FilterOrErrorMessage {
        const result = new FilterOrErrorMessage();

        if (line === HappensDateField.instructionForFieldPresence) {
            const result = new FilterOrErrorMessage();
            result.filter = (task: Task) =>
                this.dates(task).some((date) => date !== null);
            return result;
        }

        if (line === HappensDateField.instructionForFieldAbsence) {
            const result = new FilterOrErrorMessage();
            result.filter = (task: Task) =>
                !this.dates(task).some((date) => date !== null);
            return result;
        }

        const happensMatch = line.match(this.filterRegexp());
        if (happensMatch !== null) {
            const filterDate = DateParser.parseDate(happensMatch[2]);
            if (!filterDate.isValid()) {
                result.error = 'do not understand happens date';
            } else {
                if (happensMatch[1] === 'before') {
                    result.filter = (task: Task) => {
                        return this.dates(task).some(
                            (date) => date && date.isBefore(filterDate),
                        );
                    };
                } else if (happensMatch[1] === 'after') {
                    result.filter = (task: Task) => {
                        return this.dates(task).some(
                            (date) => date && date.isAfter(filterDate),
                        );
                    };
                } else {
                    result.filter = (task: Task) => {
                        return this.dates(task).some(
                            (date) => date && date.isSame(filterDate),
                        );
                    };
                }
            }
        } else {
            result.error = 'do not understand query filter (happens date)';
        }
        return result;
    }

    protected filterRegexp(): RegExp {
        return HappensDateField.happensRegexp;
    }

    /**
     * Return the task's start, scheduled and due dates, any or all of which may be null.
     */
    protected dates(task: Task): (Moment | null)[] {
        return Array.of(task.startDate, task.scheduledDate, task.dueDate);
    }

    protected fieldName(): string {
        return 'happens';
    }
}
